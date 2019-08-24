/* eslint-disable no-undef */
// eslint-disable-next-line init-declarations,no-var
declare var BrowserFS: any;
const windowAny = window as any;
windowAny.modules = {};
windowAny.require = (partialPath: string, libraryName?: string): any => {
  const library = libraryName || partialPath;
  const unpackage = "https://unpkg.com";
  const path = ((): string => {
    if (partialPath.startsWith(".") || partialPath.startsWith(unpackage)) {
      return partialPath;
    }
    return new URL(partialPath, unpackage).href;
  })();
  console.log(`Begin require '${path}'`);
  const existingModule = windowAny.modules[path];
  if (existingModule) {
    console.log(`End require (existed) '${path}'`);
    return existingModule;
  }
  const request = new XMLHttpRequest();
  request.open("GET", path, false);
  request.send();
  if (request.status !== 200) {
    throw new Error(request.statusText);
  }
  const lastModule = windowAny.currentModule;
  windowAny.currentModule = library;
  // eslint-disable-next-line no-eval
  const result = eval(request.responseText || request.response);
  windowAny.currentModule = lastModule;
  windowAny.modules[path] = result;
  console.log(`End require (imported) '${path}'`);
  return result;
};

BrowserFS.install(window);
// eslint-disable-next-line new-cap
BrowserFS.FileSystem.InMemory.Create(null, (error: any, inMemory: any) => {
  // Note that this is synchronous and occurs before the end of Create.
  BrowserFS.initialize(inMemory);
  windowAny.inMemory = inMemory;
});