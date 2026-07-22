import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MotionControl } from "../src/components/accessibility/MotionControl";

describe("MotionControl", () => {
  it("uses pressed state only for an explicit reduction", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender } = render(
      <MotionControl locale="es" state="reduce" onToggle={onToggle} />
    );

    const reduceButton = screen.getByRole("button", {
      name: "Reducir movimiento avanzado"
    });
    expect(reduceButton).toHaveAttribute("aria-pressed", "false");
    expect(reduceButton).toBeEnabled();
    await user.click(reduceButton);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(<MotionControl locale="es" state="restore" onToggle={onToggle} />);
    expect(
      screen.getByRole("button", { name: "Restaurar movimiento avanzado" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("announces a constrained policy without claiming a pressed preference", () => {
    render(
      <MotionControl locale="en" state="unavailable" onToggle={vi.fn()} />
    );

    const button = screen.getByRole("button", {
      name: "Advanced motion unavailable"
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
