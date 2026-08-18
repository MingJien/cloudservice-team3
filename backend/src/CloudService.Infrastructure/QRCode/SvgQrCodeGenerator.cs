using System.Text;
using CloudService.Application.Features.Services.Interfaces;

namespace CloudService.Infrastructure.QRCode;

/// <summary>
/// Small dependency-free QR encoder for public plan URLs.
/// It supports byte mode, error correction level L and QR versions 1-5,
/// which is enough for the configured public URLs while keeping the API self-contained.
/// </summary>
public sealed class SvgQrCodeGenerator : IQrCodeGenerator
{
    private static readonly int[] DataCodewords = [19, 34, 55, 80, 108];
    private static readonly int[] EccCodewords = [7, 10, 15, 20, 26];
    private static readonly int[][] AlignmentPositions = [[], [6, 18], [6, 22], [6, 26], [6, 30]];

    public string CreateSvgDataUrl(string content)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);
        var bytes = Encoding.UTF8.GetBytes(content);
        var version = SelectVersion(bytes.Length);
        var codewords = CreateInterleavedCodewords(bytes, version);
        var baseMatrix = CreateBaseMatrix(version);

        Matrix? best = null;
        var bestPenalty = int.MaxValue;
        for (var mask = 0; mask < 8; mask++)
        {
            var candidate = baseMatrix.Clone();
            candidate.DrawCodewords(codewords, mask);
            candidate.DrawFormatBits(mask);
            var penalty = candidate.PenaltyScore();
            if (penalty < bestPenalty)
            {
                bestPenalty = penalty;
                best = candidate;
            }
        }

        var svg = ToSvg(best ?? throw new InvalidOperationException("Unable to generate QR code."));
        return "data:image/svg+xml;base64," + Convert.ToBase64String(Encoding.UTF8.GetBytes(svg));
    }

    private static int SelectVersion(int byteLength)
    {
        for (var version = 1; version <= DataCodewords.Length; version++)
        {
            var capacityBits = DataCodewords[version - 1] * 8;
            if (12 + byteLength * 8 <= capacityBits) return version;
        }

        throw new ArgumentException("The QR content is too long for the built-in encoder.", nameof(byteLength));
    }

    private static byte[] CreateDataCodewords(byte[] bytes, int version)
    {
        var capacity = DataCodewords[version - 1];
        var bits = new List<bool>(capacity * 8);
        AddBits(bits, 0b0100, 4);
        AddBits(bits, bytes.Length, 8);
        foreach (var value in bytes) AddBits(bits, value, 8);
        for (var i = 0; i < Math.Min(4, capacity * 8 - bits.Count); i++) bits.Add(false);
        while (bits.Count % 8 != 0) bits.Add(false);
        var pad = true;
        while (bits.Count < capacity * 8)
        {
            AddBits(bits, pad ? 0xEC : 0x11, 8);
            pad = !pad;
        }

        var result = new byte[capacity];
        for (var i = 0; i < result.Length; i++)
            for (var bit = 0; bit < 8; bit++)
                result[i] |= (byte)((bits[i * 8 + bit] ? 1 : 0) << (7 - bit));
        return result;
    }

    private static byte[] CreateInterleavedCodewords(byte[] bytes, int version)
    {
        var data = CreateDataCodewords(bytes, version);
        var blockCount = version >= 4 ? 2 : 1;
        int[] dataPerBlock = version switch
        {
            1 => [19],
            2 => [34],
            3 => [55],
            4 => [40, 40],
            5 => [54, 54],
            _ => throw new ArgumentOutOfRangeException(nameof(version))
        };
        var eccPerBlock = EccCodewords[version - 1] / blockCount;
        var blocks = new List<(byte[] Data, byte[] Ecc)>(blockCount);
        var offset = 0;
        for (var block = 0; block < blockCount; block++)
        {
            var blockData = data.Skip(offset).Take(dataPerBlock[block]).ToArray();
            offset += blockData.Length;
            blocks.Add((blockData, ReedSolomon(blockData, eccPerBlock)));
        }

        var interleaved = new List<byte>(data.Length + EccCodewords[version - 1]);
        for (var index = 0; index < dataPerBlock.Max(); index++)
            foreach (var block in blocks)
                if (index < block.Data.Length) interleaved.Add(block.Data[index]);
        for (var index = 0; index < eccPerBlock; index++)
            foreach (var block in blocks) interleaved.Add(block.Ecc[index]);
        return interleaved.ToArray();
    }

    private static void AddBits(List<bool> bits, int value, int length)
    {
        for (var i = length - 1; i >= 0; i--) bits.Add(((value >> i) & 1) != 0);
    }

    private static byte[] ReedSolomon(byte[] data, int degree)
    {
        var generator = new byte[degree + 1];
        generator[0] = 1;
        var root = 1;
        for (var i = 0; i < degree; i++)
        {
            for (var j = i + 1; j > 0; j--)
                generator[j] ^= Multiply(generator[j - 1], (byte)root);
            root = Multiply((byte)root, 2);
        }

        var remainder = new byte[degree];
        foreach (var value in data)
        {
            var factor = (byte)(value ^ remainder[0]);
            Array.Copy(remainder, 1, remainder, 0, degree - 1);
            remainder[degree - 1] = 0;
            for (var i = 0; i < degree; i++) remainder[i] ^= Multiply(generator[i + 1], factor);
        }
        return remainder;
    }

    private static byte Multiply(byte x, byte y)
    {
        var result = 0;
        while (y != 0)
        {
            if ((y & 1) != 0) result ^= x;
            y >>= 1;
            x = (byte)((x << 1) ^ ((x & 0x80) != 0 ? 0x11D : 0));
        }
        return (byte)result;
    }

    private static Matrix CreateBaseMatrix(int version)
    {
        var matrix = new Matrix(version);
        var size = matrix.Size;
        matrix.DrawFinder(3, 3);
        matrix.DrawFinder(size - 4, 3);
        matrix.DrawFinder(3, size - 4);
        matrix.DrawAlignment(AlignmentPositions[version - 1]);
        matrix.DrawTimingPatterns();
        matrix.ReserveFormatInformation();
        matrix.SetFunctionModule(8, size - 8, true);
        return matrix;
    }

    private static string ToSvg(Matrix matrix)
    {
        var margin = 4;
        var dimension = matrix.Size + margin * 2;
        var output = new StringBuilder($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {dimension} {dimension}\" role=\"img\" aria-label=\"QR code\">");
        output.Append($"<rect width=\"{dimension}\" height=\"{dimension}\" fill=\"#fff\"/>");
        for (var row = 0; row < matrix.Size; row++)
            for (var col = 0; col < matrix.Size; col++)
                if (matrix.Modules[row, col]) output.Append($"<rect x=\"{col + margin}\" y=\"{row + margin}\" width=\"1\" height=\"1\" fill=\"#0B132B\"/>");
        output.Append("</svg>");
        return output.ToString();
    }

    private sealed class Matrix
    {
        public Matrix(int version)
        {
            Version = version;
            Size = version * 4 + 17;
            Modules = new bool[Size, Size];
            IsFunction = new bool[Size, Size];
        }

        private Matrix(Matrix source)
        {
            Version = source.Version;
            Size = source.Size;
            Modules = (bool[,])source.Modules.Clone();
            IsFunction = (bool[,])source.IsFunction.Clone();
        }

        public int Version { get; }
        public int Size { get; }
        public bool[,] Modules { get; }
        private bool[,] IsFunction { get; }

        public Matrix Clone() => new(this);

        public void SetFunctionModule(int x, int y, bool dark)
        {
            if (x < 0 || y < 0 || x >= Size || y >= Size) return;
            IsFunction[y, x] = true;
            Modules[y, x] = dark;
        }

        public void DrawFinder(int centerX, int centerY)
        {
            for (var dy = -4; dy <= 4; dy++)
                for (var dx = -4; dx <= 4; dx++)
                {
                    var distance = Math.Max(Math.Abs(dx), Math.Abs(dy));
                    SetFunctionModule(centerX + dx, centerY + dy, distance != 2 && distance != 4);
                }
        }

        public void DrawAlignment(int[] positions)
        {
            foreach (var centerY in positions)
                foreach (var centerX in positions)
                {
                    if (IsFunction[centerY, centerX]) continue;
                    for (var dy = -2; dy <= 2; dy++)
                        for (var dx = -2; dx <= 2; dx++)
                            SetFunctionModule(centerX + dx, centerY + dy, Math.Max(Math.Abs(dx), Math.Abs(dy)) != 1);
                }
        }

        public void DrawTimingPatterns()
        {
            for (var i = 8; i < Size - 8; i++)
            {
                if (!IsFunction[6, i]) SetFunctionModule(i, 6, i % 2 == 0);
                if (!IsFunction[i, 6]) SetFunctionModule(6, i, i % 2 == 0);
            }
        }

        public void ReserveFormatInformation()
        {
            for (var i = 0; i <= 5; i++) SetFunctionModule(8, i, false);
            SetFunctionModule(8, 7, false);
            SetFunctionModule(8, 8, false);
            SetFunctionModule(7, 8, false);
            for (var i = 9; i < 15; i++) SetFunctionModule(14 - i, 8, false);
            for (var i = 0; i < 8; i++) SetFunctionModule(Size - 1 - i, 8, false);
            for (var i = 8; i < 15; i++) SetFunctionModule(8, Size - 15 + i, false);
        }

        public void DrawFormatBits(int mask)
        {
            var data = (0b01 << 3) | mask;
            var rem = data;
            for (var i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537);
            var bits = ((data << 10) | rem) ^ 0x5412;
            for (var i = 0; i <= 5; i++) SetFunctionModule(8, i, ((bits >> i) & 1) != 0);
            SetFunctionModule(8, 7, ((bits >> 6) & 1) != 0);
            SetFunctionModule(8, 8, ((bits >> 7) & 1) != 0);
            SetFunctionModule(7, 8, ((bits >> 8) & 1) != 0);
            for (var i = 9; i < 15; i++) SetFunctionModule(14 - i, 8, ((bits >> i) & 1) != 0);
            for (var i = 0; i < 8; i++) SetFunctionModule(Size - 1 - i, 8, ((bits >> i) & 1) != 0);
            for (var i = 8; i < 15; i++) SetFunctionModule(8, Size - 15 + i, ((bits >> i) & 1) != 0);
            SetFunctionModule(Size - 8, 8, true);
        }

        public void DrawCodewords(byte[] codewords, int mask)
        {
            var bitIndex = 0;
            var upward = true;
            for (var right = Size - 1; right >= 1; right -= 2)
            {
                if (right == 6) right--;
                for (var offset = 0; offset < Size; offset++)
                {
                    var row = upward ? Size - 1 - offset : offset;
                    for (var j = 0; j < 2; j++)
                    {
                        var col = right - j;
                        if (IsFunction[row, col]) continue;
                        var dark = bitIndex < codewords.Length * 8 && ((codewords[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1) != 0;
                        if (Mask(mask, row, col)) dark = !dark;
                        Modules[row, col] = dark;
                        bitIndex++;
                    }
                }
                upward = !upward;
            }
        }

        public int PenaltyScore()
        {
            var score = 0;
            for (var row = 0; row < Size; row++) score += RunPenalty(row, true);
            for (var col = 0; col < Size; col++) score += RunPenalty(col, false);
            for (var row = 0; row < Size - 1; row++)
                for (var col = 0; col < Size - 1; col++)
                    if (Modules[row, col] == Modules[row + 1, col] && Modules[row, col] == Modules[row, col + 1] && Modules[row, col] == Modules[row + 1, col + 1]) score += 3;
            var dark = 0;
            foreach (var module in Modules) if (module) dark++;
            score += Math.Abs(dark * 20 - Size * Size * 10) / (Size * Size) * 10;
            return score;
        }

        private int RunPenalty(int index, bool rowMode)
        {
            var score = 0;
            var runColor = false;
            var runLength = 0;
            for (var i = 0; i < Size; i++)
            {
                var value = rowMode ? Modules[index, i] : Modules[i, index];
                if (value == runColor) runLength++;
                else
                {
                    if (runLength >= 5) score += 3 + runLength - 5;
                    runColor = value;
                    runLength = 1;
                }
            }
            if (runLength >= 5) score += 3 + runLength - 5;
            return score;
        }

        private static bool Mask(int mask, int row, int col) => mask switch
        {
            0 => (row + col) % 2 == 0,
            1 => row % 2 == 0,
            2 => col % 3 == 0,
            3 => (row + col) % 3 == 0,
            4 => (row / 2 + col / 3) % 2 == 0,
            5 => row * col % 2 + row * col % 3 == 0,
            6 => (row * col % 2 + row * col % 3) % 2 == 0,
            _ => (row * col % 3 + (row + col) % 2) % 2 == 0
        };
    }
}
