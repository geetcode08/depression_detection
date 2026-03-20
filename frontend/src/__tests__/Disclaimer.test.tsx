import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Disclaimer from "@/components/shared/Disclaimer";

describe("Disclaimer", () => {
  it("renders the disclaimer text", () => {
    render(<Disclaimer />);
    expect(screen.getByText(/Disclaimer/i)).toBeInTheDocument();
    expect(screen.getByText(/not a substitute/i)).toBeInTheDocument();
  });

  it("mentions crisis resources", () => {
    render(<Disclaimer />);
    expect(screen.getByText(/helpline/i)).toBeInTheDocument();
  });
});
