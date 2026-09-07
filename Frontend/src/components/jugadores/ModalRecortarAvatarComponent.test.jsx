import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ModalRecortarAvatar from "./ModalRecortarAvatarComponent";
import { calcularDimensionesRecorte } from "../../utils/recorteAvatar";

// jsdom no implementa canvas, asi que el recorte real no puede ejecutarse aca.
// Mockeamos SOLO la conversion del canvas a archivo; el resto de recorteAvatar
// (incluida calcularDimensionesRecorte) sigue siendo el codigo real.
//
// Antes esto no hacia falta porque canvasAArchivo traia un respaldo interno que
// fabricaba un File falso cuando no habia canvas. Ese respaldo vivia en codigo
// de produccion: hacia pasar el test sin recortar nada y, en un navegador donde
// toBlob fallara, el usuario habria subido una imagen corrupta sin enterarse.
vi.mock("../../utils/recorteAvatar", async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    canvasAArchivo: vi.fn(async (_canvas, nombreArchivo = "avatar.png") => ({
      file: new File(["contenido-png"], nombreArchivo, { type: "image/png" }),
      previewUrl: "blob:recorte-de-prueba",
    })),
  };
});

describe("ModalRecortarAvatar", () => {
  describe("calcularDimensionesRecorte (lógica de acotado 128px a 512px)", () => {
    it("acota hacia arriba a 128px cuando el diámetro es menor a 128px", () => {
      expect(calcularDimensionesRecorte(50)).toBe(128);
      expect(calcularDimensionesRecorte(100)).toBe(128);
      expect(calcularDimensionesRecorte(127.4)).toBe(128);
    });

    it("mantiene el tamaño exacto si está dentro del rango 128px a 512px", () => {
      expect(calcularDimensionesRecorte(128)).toBe(128);
      expect(calcularDimensionesRecorte(256)).toBe(256);
      expect(calcularDimensionesRecorte(384.2)).toBe(384);
      expect(calcularDimensionesRecorte(512)).toBe(512);
    });

    it("acota hacia abajo a 512px cuando el diámetro es mayor a 512px", () => {
      expect(calcularDimensionesRecorte(512.5)).toBe(512);
      expect(calcularDimensionesRecorte(800)).toBe(512);
      expect(calcularDimensionesRecorte(2048)).toBe(512);
    });
  });

  describe("Comportamiento del componente y overlay circular", () => {
    let origNaturalWidth;
    let origNaturalHeight;
    let origSrc;

    beforeEach(() => {
      origNaturalWidth = Object.getOwnPropertyDescriptor(
        globalThis.Image.prototype,
        "naturalWidth"
      );
      origNaturalHeight = Object.getOwnPropertyDescriptor(
        globalThis.Image.prototype,
        "naturalHeight"
      );
      origSrc = Object.getOwnPropertyDescriptor(
        globalThis.Image.prototype,
        "src"
      );

      Object.defineProperty(globalThis.Image.prototype, "naturalWidth", {
        get: () => 400,
        configurable: true,
      });
      Object.defineProperty(globalThis.Image.prototype, "naturalHeight", {
        get: () => 400,
        configurable: true,
      });
      Object.defineProperty(globalThis.Image.prototype, "src", {
        set(val) {
          origSrc?.set?.call(this, val);
          setTimeout(() => {
            if (typeof this.onload === "function") this.onload();
          }, 0);
        },
        get() {
          return origSrc?.get?.call(this);
        },
        configurable: true,
      });
    });

    afterEach(() => {
      if (origNaturalWidth) {
        Object.defineProperty(
          globalThis.Image.prototype,
          "naturalWidth",
          origNaturalWidth
        );
      }
      if (origNaturalHeight) {
        Object.defineProperty(
          globalThis.Image.prototype,
          "naturalHeight",
          origNaturalHeight
        );
      }
      if (origSrc) {
        Object.defineProperty(globalThis.Image.prototype, "src", origSrc);
      }
    });

    it("no renderiza nada cuando isOpen es false", () => {
      render(
        <ModalRecortarAvatar
          isOpen={false}
          imagenSrc="data:image/png;base64,mock"
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("renderiza el diálogo con el overlay circular y la resolución esperada", async () => {
      render(
        <ModalRecortarAvatar
          isOpen={true}
          imagenSrc="data:image/png;base64,mock"
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(
        screen.getByRole("dialog", { name: /encuadrar foto de perfil/i })
      ).toBeInTheDocument();

      // Verifica la presencia del overlay circular con máscara
      const mask = document.querySelector("#avatar-circle-cutout");
      expect(mask).toBeInTheDocument();

      // Indicador de resolución destino acotada
      expect(
        await screen.findByText(/salida: \d+×\d+ px/i)
      ).toBeInTheDocument();
    });

    it("permite ajustar el zoom con slider y botones", async () => {
      const usuario = userEvent.setup();

      render(
        <ModalRecortarAvatar
          isOpen={true}
          imagenSrc="data:image/png;base64,mock"
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const slider = screen.getByLabelText(/nivel de zoom/i);
      expect(slider).toHaveValue("1");

      const botonAcercar = screen.getByRole("button", { name: /acercar/i });
      await usuario.click(botonAcercar);
      expect(Number(slider.value)).toBeGreaterThan(1);

      const botonRestablecer = screen.getByRole("button", {
        name: /restablecer posición/i,
      });
      await usuario.click(botonRestablecer);
      expect(slider).toHaveValue("1");
    });

    it("llama a onClose al presionar Cancelar o la tecla Escape", async () => {
      const usuario = userEvent.setup();
      const mockClose = vi.fn();

      render(
        <ModalRecortarAvatar
          isOpen={true}
          imagenSrc="data:image/png;base64,mock"
          onClose={mockClose}
          onConfirm={vi.fn()}
        />
      );

      const botonCancelar = screen.getByRole("button", { name: /cancelar/i });
      await usuario.click(botonCancelar);
      expect(mockClose).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(mockClose).toHaveBeenCalledTimes(2);
    });

    it("llama a onConfirm con el archivo recortado al pulsar Aplicar recorte", async () => {
      const usuario = userEvent.setup();
      const mockConfirm = vi.fn();

      render(
        <ModalRecortarAvatar
          isOpen={true}
          imagenSrc="data:image/png;base64,mock"
          nombreArchivoOriginal="foto_perfil.jpg"
          onClose={vi.fn()}
          onConfirm={mockConfirm}
        />
      );

      const botonAplicar = await screen.findByRole("button", {
        name: /aplicar recorte/i,
      });

      await usuario.click(botonAplicar);

      await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
      const [archivoGenerado] = mockConfirm.mock.calls[0];
      expect(archivoGenerado).toBeInstanceOf(File);
      expect(archivoGenerado.name).toBe("foto_perfil.png");
    });
  });
});
