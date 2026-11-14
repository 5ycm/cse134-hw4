/*
Brian Maloney - CSE 134 Homework 4, Part 4
Light/dark theme switch with a saved preference and a view transition.

Loaded as a normal (not deferred) script in <head> so the saved theme is
applied before the page is drawn, which avoids a flash of the wrong theme.
The default theme (dark) comes from CSS, so the site works without JS.
*/

const THEME_KEY = "theme";

// Read the saved theme. Storage can throw (blocked cookies, privacy modes).
function readSavedTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark") {
            return saved;
        }
    } catch (error) {
        console.warn("The saved theme could not be read.", error);
    }
    return null;
}

// Save the theme. If this fails, the theme still changes on this page.
function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        console.warn("The theme preference could not be saved.", error);
    }
}

function getCurrentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

// The button names the action it performs.
function updateThemeButton() {
    const button = document.querySelector("#theme-toggle");
    if (button === null) {
        return;
    }
    const otherTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    button.textContent = "Switch to " + otherTheme + " theme";
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    updateThemeButton();
}

// Apply the saved theme right away (runs while <head> is parsing).
const savedTheme = readSavedTheme();
if (savedTheme !== null) {
    document.documentElement.dataset.theme = savedTheme;
}

// Once the page has loaded, reveal and wire up the button.
document.addEventListener("DOMContentLoaded", function () {
    const button = document.querySelector("#theme-toggle");
    if (button === null) {
        return;
    }

    updateThemeButton();
    button.hidden = false;   // only shown now that it can work

    button.addEventListener("click", function () {
        const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // View Transition API: the browser snapshots the old page, we change the
        // theme, then it cross-fades to the new look. If the API is missing, or
        // the user prefers reduced motion, just change the theme instantly.
        if (document.startViewTransition && !reduceMotion) {
            document.startViewTransition(function () {
                applyTheme(nextTheme);
            });
        } else {
            applyTheme(nextTheme);
        }

        saveTheme(nextTheme);   // applied above even if saving fails
    });
});
