export function getIEVersion() {
  let v = 3
  const div = document.createElement('div')
  const all = div.getElementsByTagName('i')

  while (((div.innerHTML = `<!--[if gt IE ${++v}]><i></i><![endif]-->`), all[0]));

  return v > 4 ? v : 0
}
