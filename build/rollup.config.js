import { terser } from "rollup-plugin-terser";
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import postcssCopy from 'postcss-copy';
import rollupGitVersion from 'rollup-plugin-git-version'

let plugin = require('../package.json');

let input = plugin.module;
let output = {
  file: "dist/" + plugin.name + "-src.js",
  format: "umd",
  sourcemap: true,
  name: plugin.name,
  // globals: {
  //   'jszip': 'JSZip',
  //   'geojson-vt': 'geojsonvt',
  //   '@tmcw/togeojson': 'toGeoJSON',
  // }
};

// let external = ['jszip', 'geojson-vt', '@tmcw/togeojson', 'leaflet-pointable'];
let plugins = [
  resolve(),
  commonJS({
    include: '../node_modules/**'
  }),
  rollupGitVersion()
];

export default [{
    input: input,
    output: output,
    plugins: plugins,
    // external: external,
  },
  {
    input: input,
    output: Object.assign({}, output, {
      file: "dist/" + plugin.name + ".js"
    }),
    plugins: plugins.concat(terser()),
    // external: external
  },
  {
    input: 'src/leaflet-ui.css',
    output: {
      file: 'dist/leaflet-ui.css',
      format: 'es'
    },
    plugins: [
      postcss({
        extract: true,
        inject: false,
        minimize: true,
        plugins: [
          postcssImport({}),
          postcssCopy({
            basePath: 'node_modules',
            dest: "dist",
            template: "images/[path][name].[ext]",
          })
          // postcss_url(),
          // postcss_url({
          //      url: "copy",
          //      basePath: path.resolve("."),
          //      assetPath: "resources"
          // })
        ]
      })
    ]
  },
];
