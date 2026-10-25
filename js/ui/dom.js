// Einziger Weg, DOM zu bauen: Kinder sind Knoten oder Text (Textknoten, nie HTML).
export function h(tag, attribute = {}, ...kinder) {
  const knoten = document.createElement(tag)
  for (const [name, wert] of Object.entries(attribute)) {
    if (wert !== undefined && wert !== false) knoten.setAttribute(name, wert === true ? '' : wert)
  }
  knoten.append(...kinder.flat().filter((kind) => kind != null && kind !== false && kind !== ''))
  return knoten
}
