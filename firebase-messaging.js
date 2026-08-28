async function getBlueHeartServiceWorker() {

    if (!("serviceWorker" in navigator)) {
        throw new Error(
            "This browser does not support service workers."
        );
    }

    setPushStatus(
        "Installing Blue Heart service worker…"
    );

    const registration =
        await navigator.serviceWorker.register(
            "./service-worker.js",
            {
                scope: "./"
            }
        );

    setPushStatus(
        "Waiting for service worker to activate…"
    );

    /*
       Don't use navigator.serviceWorker.ready here.
       We wait directly for THIS registration instead.
    */

    if (registration.active) {

        setPushStatus(
            "Service worker active ✓"
        );

        return registration;
    }


    const worker =
        registration.installing ||
        registration.waiting;


    if (!worker) {

        throw new Error(
            "Service worker exists but no installing, waiting, or active worker was found."
        );
    }


    await new Promise((resolve, reject) => {

        const timeout =
            setTimeout(() => {

                reject(
                    new Error(
                        "Service worker did not activate within 15 seconds."
                    )
                );

            }, 15000);


        worker.addEventListener(
            "statechange",
            () => {

                setPushStatus(
                    "Service worker: " +
                    worker.state
                );


                if (
                    worker.state ===
                    "activated"
                ) {

                    clearTimeout(timeout);

                    resolve();
                }


                if (
                    worker.state ===
                    "redundant"
                ) {

                    clearTimeout(timeout);

                    reject(
                        new Error(
                            "The service worker installation failed and became redundant."
                        )
                    );
                }

            }
        );

    });


    return registration;
}
