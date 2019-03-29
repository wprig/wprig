import { pipe as pump, from, concat } from 'mississippi';
import Vinyl from 'vinyl';

import { getThemeConfig } from './utils';

import { afterReplacementStream } from './styles';

function makeMockFile() {
  return new Vinyl({
    path: 'mock.css',
    contents: Buffer.from(`
        .entry-meta {
            margin: 1em 0;
        }
    `)
  });
}

test('minifies by default', (done) => {
  const mockFile = makeMockFile();

  function assert(files) {
    const file = files[0];
    expect(file.basename).toEqual('mock.min.css');
    // Jest matchers don't seem to work with Buffers
    expect(file.contents.toString('utf-8')).not.toContain('\n');
  }

  pump([
    from.obj([mockFile]),
    afterReplacementStream(),
    concat(assert)
  ], done);
});

test('debug config disables minify', (done) => {
  const config = getThemeConfig();
  // TODO: make a "set config" helper method
  config.dev.debug.styles = true;

  const mockFile = makeMockFile();

  function assert(files) {
    const file = files[0];
    // The .min.css extension is expected here
    expect(file.basename).toEqual('mock.min.css');
    // Jest matchers don't seem to work with Buffers
    expect(file.contents.toString('utf-8')).toContain('\n');
  }

  pump([
    from.obj([mockFile]),
    afterReplacementStream(),
    concat(assert)
  ], done);
});
