$("#patient-id-input").change(function () {
    var inputId = $(this).val();
    console.log("INPUT ID: " + inputId);
    // get name for id from server
    var name = "Test Name";
    $("#patient-name-label")[0].innerHTML = name;
});

function selectPatientAdmin() {
    var patientId = $("#patient-id-input")[0].value;
    if (patientId == '' || isNaN(patientId)) {
        return;
    }
    console.log("LOGGING IN FOR PATIENT: " + patientId);
}