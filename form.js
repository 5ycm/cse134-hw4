/*
Brian Maloney - CSE 134 Homework 4, Part 3
Progressive enhancement for form-with-js.html.
The form already validates and submits with plain HTML. This script adds:
  1. Specific error messages using the Constraint Validation API
  2. An on-page error area (a polite live region)
  3. A remaining-character counter for the message field
  4. An error history (form_errors) that is submitted as JSON
*/

// ---------- 1. Find the elements we need ----------
const contactForm = document.querySelector("#contact-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const commentsInput = document.querySelector("#comments");
const submitButton = contactForm.querySelector('button[type="submit"]');
const errorsInput = document.querySelector("#form-errors");

const infoArea = document.querySelector("#info-area");
const charCount = document.querySelector("#char-count");
const charStatus = document.querySelector("#char-status");

const errorArea = document.querySelector("#error-area");
const errorList = document.querySelector("#error-list");
const errorEmpty = document.querySelector("#error-empty");

// The fields we validate, in the order they appear on the page.
const fields = [nameInput, emailInput, commentsInput];

// Friendly names used in error messages.
const fieldLabels = {
    name: "Name",
    email: "Email",
    comments: "Message"
};

// Messages for empty required fields.
const requiredMessages = {
    name: "Name is required. Enter the name you would like me to use.",
    email: "Email is required. Enter an address I can reply to, like name@example.com.",
    comments: "Message is required. Write at least 10 characters."
};

// Remember each field's original aria-describedby (its hint) so we can
// add and remove the error id without losing the hint.
const baseDescribedBy = {};
fields.forEach(function (field) {
    baseDescribedBy[field.id] = field.getAttribute("aria-describedby");
});

// Has the user typed in this field yet? Errors only appear on blur
// for fields the user has actually edited.
const editedFields = {
    name: false,
    email: false,
    comments: false
};

// Error history. Required name from the assignment.
const form_errors = [];

// Show remaining characters as a warning at this many or fewer.
const WARNING_THRESHOLD = 100;

// JavaScript is running, so the JS-only message areas can be shown.
infoArea.hidden = false;
errorArea.hidden = false;


// ---------- 2. Validation with the Constraint Validation API ----------

// Returns a specific message for whatever is wrong, or "" if nothing is.
function getErrorMessage(field) {
    const validity = field.validity;
    const label = fieldLabels[field.id];

    if (validity.valueMissing) {
        return requiredMessages[field.id];
    }
    if (validity.typeMismatch) {
        return "Enter a complete email address with an @ and a domain, like name@example.com.";
    }
    if (validity.tooShort) {
        return label + " is too short. Write at least " + field.minLength + " characters.";
    }
    if (validity.tooLong) {
        return label + " is too long. Shorten it to " + field.maxLength + " characters or fewer.";
    }
    return "";
}

// Names the kind of error for the history (no user data is stored).
function getErrorType(validity) {
    if (validity.valueMissing) return "valueMissing";
    if (validity.typeMismatch) return "typeMismatch";
    if (validity.tooShort) return "tooShort";
    if (validity.tooLong) return "tooLong";
    return "other";
}

// Re-checks one field and sets (or clears) its custom message.
// Uses .validity only, so it never fires "invalid" events.
function checkField(field) {
    field.setCustomValidity("");          // clear any old message first
    const message = getErrorMessage(field);
    field.setCustomValidity(message);     // "" means the field is valid
    return message;
}


// ---------- 3. Showing and clearing errors on the page ----------

function errorIdFor(field) {
    return field.id + "-error";
}

function isErrorShown(field) {
    return document.getElementById(errorIdFor(field)) !== null;
}

function showError(field, message) {
    const errorId = errorIdFor(field);
    let item = document.getElementById(errorId);

    if (item === null) {
        item = document.createElement("li");
        item.id = errorId;

        // Keep the list in the same order as the fields on the page.
        let nextItem = null;
        for (let i = fields.indexOf(field) + 1; i < fields.length; i++) {
            const candidate = document.getElementById(errorIdFor(fields[i]));
            if (candidate !== null) {
                nextItem = candidate;
                break;
            }
        }
        errorList.insertBefore(item, nextItem);
    }

    // Only touch the DOM when the text changes, so screen readers
    // are not interrupted on every keystroke.
    if (item.dataset.message !== message) {
        item.dataset.message = message;
        item.textContent = "";

        const link = document.createElement("a");
        link.href = "#" + field.id;
        link.textContent = fieldLabels[field.id] + ":";
        link.addEventListener("click", function (event) {
            event.preventDefault();
            field.focus();
        });

        item.append(link, " " + message);
    }

    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", baseDescribedBy[field.id] + " " + errorId);
    updateEmptyMessage();
}

function clearError(field) {
    const item = document.getElementById(errorIdFor(field));
    if (item !== null) {
        item.remove();
    }
    field.removeAttribute("aria-invalid");
    field.setAttribute("aria-describedby", baseDescribedBy[field.id]);
    updateEmptyMessage();
}

function updateEmptyMessage() {
    errorEmpty.hidden = errorList.children.length > 0;
}

// Check a field and update what is shown for it.
function checkAndShow(field) {
    const message = checkField(field);
    if (message === "") {
        clearError(field);
    } else {
        showError(field, message);
    }
}


// ---------- 4. Events while the user edits ----------

fields.forEach(function (field) {
    // While typing: keep the custom message current, and update or remove
    // an error that is already showing. New errors are NOT added here.
    field.addEventListener("input", function () {
        editedFields[field.id] = true;
        const message = checkField(field);
        if (isErrorShown(field)) {
            if (message === "") {
                clearError(field);
            } else {
                showError(field, message);
            }
        }
    });

    // Leaving a field the user edited: show any problem.
    field.addEventListener("blur", function () {
        if (editedFields[field.id]) {
            checkAndShow(field);
        }
    });
});


// ---------- 5. Submission attempts and error history ----------

// A click on the submit button (including Enter in a text field, which the
// browser turns into a click) happens BEFORE native validation. Refresh every
// custom message so no stale message blocks a corrected form.
submitButton.addEventListener("click", function () {
    fields.forEach(checkField);
});

// When a submission is blocked, the browser fires "invalid" on each invalid
// field, all at once. "invalid" does not bubble, so we listen on the form
// in the CAPTURE phase (the "true" argument). We never call checkValidity()
// or reportValidity(), so every "invalid" event here is a submission attempt.
let attemptNumber = 0;
let attemptInProgress = false;

contactForm.addEventListener("invalid", function (event) {
    const field = event.target;

    // The first invalid event of a submission starts a new attempt.
    // setTimeout(..., 0) runs after all of this attempt's events finish.
    if (!attemptInProgress) {
        attemptInProgress = true;
        attemptNumber += 1;
        setTimeout(function () {
            attemptInProgress = false;
        }, 0);
    }

    const message = checkField(field);
    if (message === "") {
        return;
    }
    showError(field, message);

    // One entry per invalid field per attempt. No names, emails, or message text.
    form_errors.push({
        attempt: attemptNumber,
        field: field.name,
        error: getErrorType(field.validity),
        message: message,
        time: new Date().toISOString()
    });
}, true);

// "submit" only fires once the form is valid. Save the history right before
// the normal POST to httpbin.
contactForm.addEventListener("submit", function () {
    errorsInput.value = JSON.stringify(form_errors);
});


// ---------- 6. Character counter for the message ----------

const maxCharacters = commentsInput.maxLength;   // read from the HTML maxlength
let lastCountState = "normal";

function formatNumber(number) {
    return number.toLocaleString("en-US");
}

function updateCharCount() {
    const remaining = maxCharacters - commentsInput.value.length;
    const unit = remaining === 1 ? "character" : "characters";
    let state = "normal";
    let text = formatNumber(remaining) + " " + unit + " remaining.";

    if (remaining <= 0) {
        state = "limit";
        text = "You have reached the " + formatNumber(maxCharacters) +
            "-character limit. You can still edit or shorten your message.";
    } else if (remaining <= WARNING_THRESHOLD) {
        state = "warning";
        text = "Only " + formatNumber(remaining) + " " + unit +
            " left. You are close to the " + formatNumber(maxCharacters) + "-character limit.";
    }

    charCount.textContent = text;
    charCount.classList.toggle("is-warning", state === "warning");
    charCount.classList.toggle("is-limit", state === "limit");

    // Announce only when the state changes (not on every keystroke).
    if (state !== lastCountState) {
        charStatus.textContent = state === "normal" ? "" : text;
        lastCountState = state;
    }
}

// "input" fires for typing, pasting, cutting, and deleting.
commentsInput.addEventListener("input", updateCharCount);
updateCharCount();
