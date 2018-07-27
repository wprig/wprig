/* eslint-env es6 */
'use strict';

// External dependencies
import {src, dest} from 'gulp';
import postcssPresetEnv from 'postcss-preset-env';
import pump from 'pump';
import requireUncached from 'require-uncached';

// Internal dependencies
import {rootPath, paths, gulpPlugins, gulpReplaceOptions} from './constants';
import {getThemeConfig} from './utils';

/**
* CSS via PostCSS + CSSNext (includes Autoprefixer by default).
*/
export default function styles(done) {
   // get a fresh copy of the config
   const config = getThemeConfig(true);

   // Reload cssVars every time the task runs.
   const cssVars = requireUncached(paths.config.cssVars);

   pump([
       src(paths.styles.src, {sourcemaps: true}),
       // gulpPlugins.print()
       gulpPlugins.phpcs({
           bin: `${rootPath}/vendor/bin/phpcs`,
           standard: 'WordPress',
           warningSeverity: 0
       }),
       // Log any problems found
       gulpPlugins.phpcs.reporter('log'),
       gulpPlugins.postcss([
           postcssPresetEnv({
               stage: 3,
               browsers: config.dev.browserslist,
               features: {
                   'custom-properties': {
                       preserve: false,
                       variables: cssVars.variables,
                   },
                   'custom-media-queries': {
                       preserve: false,
                       extensions: cssVars.queries,
                   }
               }
           })
       ]),
       gulpPlugins.stringReplace('wprig', config.theme.slug, gulpReplaceOptions),
       gulpPlugins.stringReplace('WP Rig', config.theme.name, gulpReplaceOptions),
       dest(paths.verbose),
       gulpPlugins.if(
           !config.dev.debug.styles, 
           gulpPlugins.cssnano()
        ),
       dest(paths.styles.dest, {sourcemaps: true}),
   ], done);
}