/* eslint-env es6 */
/* global test, expect, beforeAll, afterAll */

/**
 * External dependencies
 */
import {
  concat
} from 'mississippi';
import Vinyl from 'vinyl';
import fs from 'fs';
import rimraf from 'rimraf';

/**
 * Internal dependencies
 */
import { getThemeConfig } from '../../utils';
import {
  gulpTestPath,
  prodThemePath,
  isProd,
  rootPath,
  nameFieldDefaults,
  paths
} from '../../constants';
import { bundleTheme } from '../../../gulpfile.babel';

const filesToMock = [
  {
    mock: `${gulpTestPath}/prod-build/config.local.json`,
    dest: `${rootPath}/config/config.local.json`
  },
  {
    mock: `${gulpTestPath}/translations/fr_FR.po`,
    dest: `${rootPath}/languages/fr_FR.po`,
    prodDest: `${prodThemePath}/languages/fr_FR.po`
  },
  {
    mock: `${gulpTestPath}/translations/fr_FR.mo`,
    dest: `${rootPath}/languages/fr_FR.mo`,
    prodDest: `${prodThemePath}/languages/fr_FR.mo`
  },
];

function makeMockFiles() {

  const output = [];
  filesToMock.forEach((file) => {
    output.push(
      new Vinyl({
        path: file.dest,
        contents: fs.readFileSync(file.mock)
      })
    );
  });
  return output;
}

beforeAll( (done) => {
  // Copy the mock files to their destination before testing.
  filesToMock.forEach((file) => {
    fs.copyFileSync(file.mock, file.dest);
  });

  // Run the theme bundle task.
  bundleTheme(done);
}, 60000);


afterAll((done) => {
  // Delete the mock files after testing.
  filesToMock.forEach((file) => {
    if ( fs.existsSync(file.dest) ) {
      fs.unlinkSync(file.dest);
    }
  });

  // Delete the prod theme directory after testing.
  if ( fs.existsSync(prodThemePath) ) {
    rimraf.sync(prodThemePath);
  }
  done();
});

test('gulp runs in production mode', (done) => {
  
  function assert() {
    expect(isProd).toBe(true);
  }

  concat(assert);
  done();
});

test('the production theme directory exists', (done) => {
  const config = getThemeConfig(true);
  
  function assert() {
    const prodThemeDirExists = fs.existsSync(prodThemePath);
    expect(nameFieldDefaults.slug === config.theme.slug).toBe(false);
    expect(prodThemeDirExists).toBe(true);
  }

  concat(assert);
  done();
});

test('files are copied to the production theme with strings replaced', (done) => {
  const copiedFiles = [];

  for( let filePath of paths.export.src ) {
    copiedFiles.push(
      filePath.replace(rootPath, prodThemePath)
    );
  }

  filesToMock.forEach( (file) => {
    if( file.hasOwnProperty('prodDest') ) {
      copiedFiles.push(file.prodDest);
    }
  } );
  
  paths.export.stringReplaceSrc.forEach( (filePath) => {
    if( ! filePath.includes('*') ) {
      copiedFiles.push(
        filePath.replace(rootPath,prodThemePath)
      );
    }
  } );
  
  function assert() {
    // Make sure the files exist.
    copiedFiles.forEach((filePath) => {
      const fileExists = fs.existsSync(filePath);
      expect(fileExists).toBe(true);
      const fileContents = fs.readFileSync(
        filePath,
        { encoding: 'utf-8' }
      );
      // And that they don't have any default strings.
      Object.keys(nameFieldDefaults).forEach(key => {
        expect(fileContents).not.toContain(nameFieldDefaults[key]);
      });
    });
  }

  concat(assert);
  done();
});