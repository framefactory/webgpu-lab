/**
 * Webpack configuration utilities
 * Version 3.8
 *
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 * License: MIT
 */

"use strict";

const path = require("path");
const mkdirp = require("mkdirp");
const childProcess = require("child_process");
const webpack = require("webpack");

const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    getGitDescription: function() {
        // execute git describe to retrieve project version
        let projectVersion = "v0.0.0";
        try {
            projectVersion = childProcess.execSync("git describe --tags").toString().trim();
        }
        catch {}

        return projectVersion
    },

    createWebpackConfig(settings) {
        return (env, argv) => {
            const isDevMode = argv.mode !== undefined ? argv.mode !== "production" : process.env["NODE_ENV"] !== "production";
            const componentKey = argv.env.component !== undefined ? argv.env.component : "all";
        
            //console.log(argv);
        
            console.log(`
WEBPACK - PROJECT BUILD CONFIGURATION
    build mode: ${isDevMode ? "development" : "production"}
    component key: ${componentKey}
    source folder: ${settings.folders.source}
    output folder: ${settings.folders.output}
    modules folder: ${settings.folders.modules}
            `);
        
            const components = settings.components;
            let configurations = null;
        
            if (componentKey === "all") {
                configurations = Object.keys(components).map(key => createBuildConfiguration(key, settings, isDevMode));
            }
            else {
                configurations = [ createBuildConfiguration(componentKey, settings, isDevMode) ];
            }
        
            if (configurations) {
                if (settings.folders.assets && settings.folders.static) {
                    const copyAssetsPlugin = new CopyWebpackPlugin({
                        patterns: [{ from: settings.folders.assets, to: settings.folders.static }]
                    });
                    configurations[0].plugins.push(copyAssetsPlugin);
                }
        
                if (settings.useDevServer) {
                    configurations[0].devServer = {
                        static: [
                            settings.folders.output,
                            settings.folders.static
                        ],

                        port: process.env["DEV_SERVER_PORT"],

                        allowedHosts: "all",

                        client: {
                            logging: "info",
                            overlay: true,
                            webSocketURL: process.env["DEV_SERVER_WEBSOCKET_URL"]
                        },

                        // setupMiddlewares: (middlewares, server) => {
                        //     if (!server) {
                        //         throw new Error('webpack-dev-server is not defined');
                        //     }

                        //     server.app.get("/", (req, res) => {
                        //         res.redirect(`${components.default.bundle}.html`);
                        //     });

                        //     return middlewares;
                        // },
                    }

                    
                }
        
                configurations.forEach(configuration => {
                    if (configuration.target === "electron-main") {
                        configuration.externals = {
                            "electron-reload": "commonjs2 electron-reload",
                        };
                    }
                });
            }
        
            return configurations;
        }    
    }
}

function createBuildConfiguration(key, settings, isDevMode)
{
    const buildMode = isDevMode ? "development" : "production";
    const component = settings.components[key]

    if (component === undefined) {
        console.warn(`\n[webpack.utils.js] can't build, component not defined: '${key}'`);
        process.exit(1);
    }

    const componentVersion = component.version || settings.projectVersion;
    const target = component.target || settings.defaultTarget;

    const displayTitle = component.title + (isDevMode ? ` ${componentVersion} DEV` : "");

    const outputDir = component.subdir ? path.resolve(settings.folders.output, component.subdir) : settings.folders.output;
    mkdirp.sync(outputDir);

    const jsOutputFileName = path.join(settings.folders.jsFolder, "[name].js");
    const cssOutputFileName = path.join(settings.folders.cssFolder, "[name].css");
    const htmlOutputFileName = `${component.bundle}.html`;
    const htmlElement = component.element;

    console.log(`
WEBPACK - COMPONENT BUILD CONFIGURATION
    key: ${key}
    bundle: ${component.bundle}
    target: ${target}
    title: ${displayTitle}
    version: ${componentVersion}
    output folder: ${outputDir}
    js file: ${jsOutputFileName}
    css file: ${cssOutputFileName}
    html file: ${component.template ? htmlOutputFileName : "n/a"}
    html element: ${component.element ? htmlElement : "n/a"}
    `);

    const config = {
        mode: buildMode,
        devtool: isDevMode ? "source-map" : false,
        target: component.target || target,

        entry: {
            [component.bundle]: path.resolve(settings.folders.source, component.entry),
        },

        output: {
            path: outputDir,
            filename: jsOutputFileName
        },

        resolve: {
            modules: [ settings.folders.modules ],
            alias: settings.aliases,
            extensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".wasm" ],
        },

        optimization: {
            minimize: !isDevMode,

            minimizer: [
                new TerserPlugin({ parallel: true }),
                new CssMinimizerPlugin(),
            ],
        },

        plugins: [
            new webpack.DefinePlugin({
                ENV_PRODUCTION: JSON.stringify(!isDevMode),
                ENV_DEVELOPMENT: JSON.stringify(isDevMode),
                ENV_VERSION: JSON.stringify(componentVersion),
            }),
            new MiniCssExtractPlugin({
                filename: cssOutputFileName,
            }),
            new ForkTsCheckerWebpackPlugin(),
        ],

        module: {
            rules: [
                {
                    // Enforce source maps for all javascript files
                    enforce: "pre",
                    test: /\.js$/,
                    loader: "source-map-loader",
                },
                {
                    // Typescript
                    test: /\.tsx?$/,
                    use: [{
                        loader: "ts-loader",
                        options: { compilerOptions: { noEmit: false } },
                    }],
                },
                {
                    // WebAssembly
                    test: /\.wasm$/,
                    type: "javascript/auto",
                    loader: "file-loader",
                    options: {
                        name: '[path][name].[ext]',
                    },
                },
                {
                    // Raw text and shader files
                    test: /\.(txt|glsl|hlsl|frag|vert|fs|vs)$/,
                    loader: "raw-loader"
                },
                {
                    // SCSS
                    test: /\.s[ac]ss$/i,
                    use: [
                        isDevMode ? "style-loader" : MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader',
                    ],
                },
                {
                    // CSS
                    test: /\.css$/,
                    use: [
                        isDevMode ? "style-loader" : MiniCssExtractPlugin.loader,
                        "css-loader",
                    ]
                },
                {
                    // Handlebars templates
                    test: /\.hbs$/,
                    loader: "handlebars-loader",
                },
            ],
        },
    };

    if (component.template) {
        config.plugins.push(new HTMLWebpackPlugin({
            filename: htmlOutputFileName,
            template: path.resolve(settings.folders.source, component.template),
            title: displayTitle,
            version: componentVersion,
            isDevelopment: isDevMode,
            element: htmlElement,
            chunks: [ component.bundle ],
        }));
    }

    return config;
}
