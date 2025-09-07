document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver(() => {
        const orgFileInput = document.getElementById('orgCsvFile');
        if (orgFileInput && !orgFileInput.dataset.bound) {
            orgFileInput.dataset.bound = true;
            orgFileInput.addEventListener('change', (e) => {
                const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
                document.getElementById('orgCsvFileName').textContent = fileName;
            });
            console.log("Orgs event bound");
        }
    });

    observer.observe(document.getElementById("main-content"), { childList: true, subtree: true });
});
