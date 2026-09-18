"use strict";

// =====================================
// SUPABASE
// =====================================

const SUPABASE_URL =
    "https://vzqpfikymnvowdypbpnb.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_HeLNv4p7Fc3gAzp5jHOk7Q_zPDxNaQB";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =====================================
// ELEMENTEN
// =====================================

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const loginButton =
    document.getElementById("loginButton");

const loginButtonText =
    document.getElementById("loginButtonText");

const emailVeld =
    document.getElementById("email");

const wachtwoordVeld =
    document.getElementById("password");


// =====================================
// ELEMENTCONTROLE
// =====================================

if (
    !loginForm ||
    !loginMessage ||
    !loginButton ||
    !loginButtonText ||
    !emailVeld ||
    !wachtwoordVeld
) {
    throw new Error(
        "Onderdelen van het loginformulier ontbreken."
    );
}


// =====================================
// MELDINGEN
// =====================================

function toonMelding(
    tekst,
    type = ""
) {
    loginMessage.textContent =
        tekst;

    loginMessage.classList.remove(
        "login-message-success",
        "login-message-error",
        "login-message-warning"
    );

    if (type) {
        loginMessage.classList.add(
            `login-message-${type}`
        );
    }
}


function wisMelding() {

    loginMessage.textContent = "";

    loginMessage.classList.remove(
        "login-message-success",
        "login-message-error",
        "login-message-warning"
    );
}


// =====================================
// CAPTCHA
// =====================================

let captchaToken = null;


// Turnstile-callbacks moeten globaal bereikbaar zijn.

window.onCaptchaSuccess =
    function (token) {

        captchaToken =
            String(token || "");

        wisMelding();
    };


window.onCaptchaExpired =
    function () {

        captchaToken = null;

        toonMelding(
            "De beveiligingscontrole is verlopen. Probeer opnieuw.",
            "warning"
        );
    };


window.onCaptchaError =
    function () {

        captchaToken = null;

        toonMelding(
            "De beveiligingscontrole kon niet worden geladen.",
            "error"
        );
    };


function resetCaptcha() {

    captchaToken = null;

    if (
        window.turnstile &&
        typeof window.turnstile.reset ===
        "function"
    ) {
        window.turnstile.reset();
    }
}


// =====================================
// KNOPSTATUS
// =====================================

function zetLoginKnopBezig() {

    loginButton.disabled =
        true;

    loginButtonText.textContent =
        "Bezig met inloggen...";
}


function herstelLoginKnop() {

    loginButton.disabled =
        false;

    loginButtonText.textContent =
        "Inloggen";
}


// =====================================
// EMAIL NORMALISEREN
// =====================================

function normaliseerEmail(email) {

    return email
        .trim()
        .toLowerCase();
}


// =====================================
// INLOGGEN
// =====================================

loginForm.addEventListener(
    "submit",

    async function (event) {

        event.preventDefault();


        // =================================
        // WAARDEN
        // =================================

        const email =
            normaliseerEmail(
                emailVeld.value
            );

        const password =
            wachtwoordVeld.value;


        // =================================
        // HTML VALIDATIE
        // =================================

        if (
            !loginForm.checkValidity()
        ) {
            loginForm.reportValidity();
            return;
        }


        // =================================
        // EMAIL
        // =================================

        if (
            !email ||
            !emailVeld.checkValidity()
        ) {
            toonMelding(
                "Vul een geldig e-mailadres in.",
                "warning"
            );

            emailVeld.focus();

            return;
        }


        // =================================
        // WACHTWOORD
        // =================================

        if (!password) {

            toonMelding(
                "Vul je wachtwoord in.",
                "warning"
            );

            wachtwoordVeld.focus();

            return;
        }


        // =================================
        // CAPTCHA
        // =================================

        if (!captchaToken) {

            toonMelding(
                "Voltooi eerst de beveiligingscontrole.",
                "warning"
            );

            return;
        }


        // =================================
        // LOGIN STARTEN
        // =================================

        zetLoginKnopBezig();

        wisMelding();


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({
                        email,
                        password,

                        options: {
                            captchaToken
                        }
                    });


            // CAPTCHA-token is eenmalig.
            captchaToken = null;


            // =================================
            // LOGIN MISLUKT
            // =================================

            if (error) {

                console.error(
                    "Login fout:",
                    error
                );


                toonMelding(
                    "E-mailadres, wachtwoord of beveiligingscontrole is onjuist.",
                    "error"
                );


                resetCaptcha();

                herstelLoginKnop();

                return;
            }


            // =================================
            // SESSIE CONTROLEREN
            // =================================

            if (
                !data ||
                !data.session ||
                !data.user
            ) {

                toonMelding(
                    "Inloggen is niet gelukt. Probeer het opnieuw.",
                    "error"
                );


                resetCaptcha();

                herstelLoginKnop();

                return;
            }


            // =================================
            // LOGIN GELUKT
            // =================================

            toonMelding(
                "✓ Login gelukt! Je wordt doorgestuurd...",
                "success"
            );


            window.location.replace(
                "beheer.html"
            );

        } catch (error) {

            console.error(
                "Verbindingsfout:",
                error
            );


            toonMelding(
                "Er kon geen verbinding worden gemaakt. Probeer het opnieuw.",
                "error"
            );


            resetCaptcha();

            herstelLoginKnop();
        }

    }
);
