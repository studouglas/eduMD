var currentPatientId = "22";
var currentPatientName = "John Sno";
var allModules; // array of below objects, parent is 
var patientModules; // array of below objects

/* JSON for Modules ==============
{
    "moduleId":"10",
    "title":"Dealing with Anger",
    "content":"<p>The steps to...</p>",
    "parent_id":"40" or "",
    "data_type":"",
    "doctor_id":"20" or "",
    "shared":"true" or "false"
}
============================== */

$(document).ready(function () {
    allModules = getAllModules();
    writeModulesToHtml();
    prepareList();
    
    $("#patient-id-input").bind('input', function () {            
        var inputId = $(this).val();
        
        // get name for id from server
        var name = 'Test Name (id: ' + inputId + ')';
        
        if (inputId != '' && name != '') {
            $("#patient-name-label")[0].innerHTML = name;
            $("#login-button").removeClass('disabled-button');
        } else {
            $("#patient-name-label")[0].innerHTML = 'Patient not Found';
            $("#login-button").addClass('disabled-button');
        }
    });
    
    $(".search-modules").bind('input', function () {            
        writeModulesToHtml($(this).val());
    });
    
    $(".module-list li").click(function () {
        console.log(this);
        showModuleOverview(this.id);
    });
});

function showModuleOverview(moduleId) {
    $(".module-preview-title")[0].innerHTML = "MODULE: " + moduleId;
    $(".module-preview-content")[0].innerHTML = "<p>CONTENT HERE</p>";
}

function getAllModules() {
    return [];
}

function getPatientModules() {
    return [];
}

function writeModulesToHtml(filter) {
    var modulesToWrite = (filter == '') ? allModules : filterModules(filter);
    
    var moduleListHtml = '';
//    for (i = 0; i < modulesToWrite.length; i++) {
//        var id = modulesToWrite[i].module_id;
//        var title = modulesToWrite[i].title;
//        moduleListHtml += '\n<li id="all_' + id + '"><p class="module-title">' + title + '</p></li>';
//    }
    moduleListHtml += '<li id="all_104"><p class="module-title">Multiple Sclerosis</p></li>\n'
    moduleListHtml += '<li id="all_105"><p class="module-title">Dementia</p></li>\n'
    moduleListHtml += '<li id="all_106"><p class="module-title">Alzheimer\'s</p></li>\n'
    moduleListHtml += '<li id="all_104">\n'
    moduleListHtml += '<p class="module-title module-parent-title">Respitory</p>\n'
    moduleListHtml += '<ul class="module-children-list">\n'
    moduleListHtml += '<li id="all_107"><p class="module-title">Asthma</p></li>\n'
    moduleListHtml += '<li id="all_108"><p class="module-title">Ashtma 2</p></li>\n'
    moduleListHtml += '<li id="all_109"><p class="module-title">Asthma 3</p></li>\n'
    moduleListHtml += '<li id="all_110"><p class="module-title">Asthma 4</p></li>\n'
    moduleListHtml += '</ul>\n'
    moduleListHtml += '</li>\n'
    moduleListHtml += '<li id="all_111"><p class="module-title">Stroke</p></li>\n'
    $(".module-list")[0].innerHTML = moduleListHtml;
}

function filterModules(filter) {
    var filteredModules = [];
    for (i = 0; i < allModules.length; i++) {
        if (allModules[i].title.search(filter) > -1) {
            filteredModules.push(allModules[i]);   
        }
    }
    console.log(filteredModules);
    return filteredModules;
}

function writePatientModulesToHtml() {
    var moduleListHtml = '';
    moduleListHtml += '<li id="patient_101"><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn" onclick="removeModuleForPatient(101)">X</p></li>\n';
    moduleListHtml += '<li id="patient_102"><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn" onclick="removeModuleForPatient(102)">X</p></li>\n';
    moduleListHtml += '<li id="patient_103"><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn" onclick="removeModuleForPatient(103)">X</p></li>\n';
    moduleListHtml += '<li id="patient_104"><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn" onclick="removeModuleForPatient(104)">X</p></li>\n';
    moduleListHtml += '<li id="patient_105"><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn" onclick="removeModuleForPatient(105)">X</p></li>\n';
    $(".module-list-patient")[0].innerHTML = moduleListHtml;
}

function loginPatient() {
    var patientId = $("#patient-id-input")[0].value;
    if (patientId == '' || isNaN(patientId)) {
        return;
    }
    
    currentPatientId = patientId;
    currentPatientName = getPatientNameForId(patientId);
    
    patientModules = getPatientModules();
    writePatientModulesToHtml();
    
    var patientNameElements = $("span#patient-name");
    for (i = 0; i < patientNameElements.length; i++) {
        patientNameElements[i].innerHTML = currentPatientName;
    }
    var patientIdElements = $("span#patient-id");
    for (i = 0; i < patientIdElements.length; i++) {
        patientIdElements[i].innerHTML = currentPatientId;
    }
    $(".login-container").hide();
    $(".module-select-container").show();
}

function getPatientNameForId(patientId) {
    var name = 'John Snow';
    $.ajax({
        url: 'http://deltahacks2.appspot.com/user/get/patient/' + patientId,
        type: 'GET',
        success: function (data) {
            console.log("RECEIVED ANSWER");
            console.log(data);
            name = "";
        }
    });
    return name;
} 

// http://jasalguero.com/ledld/development/web/expandable-list/
function prepareList() {
    $('.module-list').find('li:has(ul)').click(function (event) {
        if (this == event.target) {
            $(this).toggleClass('expanded');
            $(this).children('ul').toggle('medium');
        }
        return false;
    }).addClass('collapsed').children('ul').hide();

    $('#expandList').unbind('click').click( function() {
        $('.collapsed').addClass('expanded');
        $('.collapsed').children().show('medium');
    });
    
    $('#collapseList').unbind('click').click( function() {
        $('.collapsed').removeClass('expanded');
        $('.collapsed').children().hide('medium');
    });
}

function switchPatientsClicked() {
    window.location.href = "adminpatient.html";
}

function removeModuleForPatient(moduleId) {
    // call api to remove module
    
    patientModules = getPatientModules();
    writePatientModulesToHtml();
    
    console.log("Remove module: " + moduleId + " for patient: " + currentPatientId);
}

function closeModalPopup() {
    $('.fullscreen-modal-container').hide();
    $('.new-module-modal').hide();
    $('.new-patient-modal').hide();
    $("#new-patient-name-input")[0].value = '';
    $("#public-input")[0].checked = true;
    $("#patient-name-input")[0].value = '';
    $("#category-input")[0].value = '';
    $("#title-input")[0].value = '';
    $("#content-input")[0].value = '';
}

function addNewModuleClicked() {
    $('.new-module-modal').show();
    $("patient-name-input").value = currentPatientName;
}

function addModuleFromForm() {
    var isPrivate = $("#public-input")[0].checked; //boolean
    var patientName = $("#patient-name-input")[0].value;
    var category = $("#category-input")[0].value;
    var title = $("#title-input")[0].value;
    var content = $("#content-input")[0].value;
    
    console.log("PRIVATE: " + isPrivate);
    console.log("PATIENT: " + patientName);
    console.log("CATEGOR: " + category);
    console.log("TITLE:   " + title);
    console.log("CONTENT: " + content);
    
    closeModalPopup();
}

function addNewPatient() {
    $(".new-patient-modal").show();
}

function addNewPatientFromForm() {
    var name = $("#new-patient-name-input")[0].value;
    console.log("Add Patient: <" + name + ">");
    closeModalPopup();
}