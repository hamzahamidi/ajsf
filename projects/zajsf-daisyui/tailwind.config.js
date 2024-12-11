/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
        "./projects/zajsf-daisyui/**/*.{html,ts,css}"
    ],
    theme: {
        extend: {},
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: ["light", "dark", "cupcake", "cmyk", "pastel",
            {
                daisyui_default: {
                    ...require("daisyui/src/theming/themes")["light"]
                },
                daisyui_leaf: {
                    ...require("daisyui/src/theming/themes")["light"]
                }
            }
        ]
    },
}