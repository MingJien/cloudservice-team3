import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("prevents duplicate submits while loading and exposes progress text", () => {
    render(<Button isLoading>Gửi</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Đang xử lý...");
  });
});
