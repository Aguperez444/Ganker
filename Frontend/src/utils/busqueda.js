// Pasa un texto a minuscula y sin tildes, para que buscar "kaisa" encuentre
// "Kai'Sa" y "region" encuentre "Región".
export function normalizarTexto(texto) {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .toLowerCase()
    .trim();
}

// Elementos cuyo `name` contiene el texto buscado. Sin texto, devuelve todos.
export function filtrarPorNombre(items, texto) {
  const buscado = normalizarTexto(texto);
  if (!buscado) return items;

  return items.filter((item) => normalizarTexto(item.name).includes(buscado));
}
