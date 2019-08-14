/* eslint-disable no-undef */
(window as any).require = (path: string): any => {
  console.log(`Begin require '${path}'`);
  const request = new XMLHttpRequest();
  request.open("GET", path, false);
  request.send();
  if (request.status !== 200) {
    throw new Error(request.statusText);
  }
  // eslint-disable-next-line no-eval
  const result = eval(request.responseText || request.response);
  console.log(`End require '${path}'`, result);
  return result;
};
