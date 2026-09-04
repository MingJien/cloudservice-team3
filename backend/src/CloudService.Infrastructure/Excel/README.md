# Owner: Người chọn Gói A

`OrderXlsxExportFormatter` tạo workbook Office Open XML (`.xlsx`) trực tiếp, không đưa dependency Excel vào Application. File có header, dòng dữ liệu, số tiền dạng số và bộ lọc; mở được bằng Microsoft Excel/LibreOffice. Nếu nhóm được phép thêm package trong môi trường triển khai, có thể thay implementation này bằng ClosedXML mà không đổi `IOrderExportFormatter`.
