var currentPatientId = "22";
var currentPatient;
var allModules = []; // array of below objects, parent is 
var patientModules = []; // array of below objects
var previewedModuleId;

/* JSON for Modules ==============
{
    "module_id":"10",
    "title":"Dealing with Anger",
    "content":"<p>The steps to...</p>",
    "parent_id":"40" or "",
    "data_type":"",
    "doctor_id":"20" or "",
    "shared":"true" or "false"
}
============================== */

$(document).ready(function () {
    loadModulesFromServer();
    
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
});

function showModuleOverview(moduleId) {
    console.log("showOverview(" + moduleId + ")");
    for (var i = 0; i < allModules.length; i++) {
        if (allModules[i].id == moduleId) {
            $("#module-preview-title")[0].innerHTML = allModules[i].title;
            $("#module-preview-content")[0].innerHTML = allModules[i].content;
            previewedModuleId = moduleId;
        }
    }
}

function loadModulesFromServer() {
    // get in ajax, on success write to DOM
    $.ajax({
        url: 'http://deltahacks2.appspot.com/user/get/condition/all',
        type: 'GET',
        success: function (data) {
            console.log("RECEIVED ANSWER (loadModulesFromServer): ");
            var jsonData = JSON.parse(data);
            console.log(jsonData);
            allModules = jsonData.conditions;
            sortAllModules();
            writeModulesToHtml();
        }
    });
}

function sortAllModules() {
    console.log("SORTING ALLMODULES:");
    console.log(allModules);
    allModules.sort(function(a,b) {
        return a.title.localeCompare(b.title);
    });
    
    var indexOfLastChild = 1;
    for (var i = 1; i < allModules.length; i++) {    
        if (allModules[i].parent_id == allModules[i].id)
    }
    console.log("DONE SORT:");
    console.log(allModules);
}

function loadPatientModulesFromAllModules() {
//    patientModules = [];
//    var patientModuleNums = currentPatient.modules;
//    for (var i = 0; i < patientModuleNums.length; i++) {
//        for (var j = 0; j < allModules.length; j++) {
//            if (allModules[j].id == patientModuleNums[i]) {
//                patientModules.push(JSON.parse(JSON.stringify(allModules[j]))); // creates copy, not ref
//            }
//        }
//    }
//    
//    writePatientModulesToHtml();
}

function writeModulesToHtml(filter) {
    var modulesToWrite = (filter == null || filter == '') ? allModules : filterModules(filter);
    
    var moduleListHtml = '';
    for (i = 0; i < modulesToWrite.length; i++) {
        var id = modulesToWrite[i].id;
        var title = modulesToWrite[i].title;
        moduleListHtml += '\n<li id="' + id + '"><p class="module-title">' + title + '</p></li>';
    }
//    moduleListHtml += '<li id="all_104"><p class="module-title">Multiple Sclerosis</p></li>\n'
//    moduleListHtml += '<li id="all_105"><p class="module-title">Dementia</p></li>\n'
//    moduleListHtml += '<li id="all_106"><p class="module-title">Alzheimer\'s</p></li>\n'
//    moduleListHtml += '<li id="all_104" class="module-parent">\n'
//    moduleListHtml += '<p class="module-title module-parent-title">Respitory</p>\n'
//    moduleListHtml += '<ul class="module-children-list">\n'
//    moduleListHtml += '<li id="all_107"><p class="module-title">Asthma</p></li>\n'
//    moduleListHtml += '<li id="all_108"><p class="module-title">Ashtma 2</p></li>\n'
//    moduleListHtml += '<li id="all_109"><p class="module-title">Asthma 3</p></li>\n'
//    moduleListHtml += '<li id="all_110"><p class="module-title">Asthma 4</p></li>\n'
//    moduleListHtml += '</ul>\n'
//    moduleListHtml += '</li>\n'
//    moduleListHtml += '<li id="all_111"><p class="module-title">Stroke</p></li>\n'
    $(".module-list")[0].innerHTML = moduleListHtml;
    
    $(".module-list li").click(function () {
        if (!$(this).hasClass("module-parent")) {
            showModuleOverview(this.id);   
        }
    });
    
    prepareList();
}

function filterModules(filter) {
    filter = filter.toLowerCase();
    var filteredModules = [];
    for (var i = 0; i < allModules.length; i++) {
        if (allModules[i].title.toLowerCase().search(filter) > -1) {
            filteredModules.push(JSON.parse(JSON.stringify(allModules[i])));
        }
    }
    return filteredModules;
}

function writePatientModulesToHtml() {
    var moduleListHtml = '';
    for (var i = 0; i < patientModules.length; i++) {
      moduleListHtml += '<li id="' + patientModules[i].id + '"><p class="module-title module-title-with-btn">';
      moduleListHtml += patientModules[i].title + '</p><p class="module-title-btn" onclick="removeModuleForPatient(';
      moduleListHtml += patientModules[i].id + ')">X</p></li>\n';  
    }

    $(".module-list-patient")[0].innerHTML = moduleListHtml;
}

function loginPatient() {
    var patientId = $("#patient-id-input")[0].value;
    if (patientId == '' || isNaN(patientId)) {
        return;
    }
    
    currentPatientId = patientId;
    getPatientWithId();
    
    loadPatientModulesFromAllModules();
    
    var patientIdElements = $("span#patient-id");
    for (i = 0; i < patientIdElements.length; i++) {
        patientIdElements[i].innerHTML = currentPatientId;
    }
    $(".login-container").hide();
    $(".module-select-container").show();
}

function getPatientWithId() {
    $.ajax({
        url: 'http://deltahacks2.appspot.com/user/get/patient/' + currentPatientId,
        type: 'GET',
        success: function (data) {
            console.log("RECEIVED ANSWER");
            console.log(data);
            
            var jsondata = JSON.parse(data);
            currentPatient = jsondata;
            var patientNameElements = $("span#patient-name");
            for (i = 0; i < patientNameElements.length; i++) {
                patientNameElements[i].innerHTML = currentPatient.patient_name;
            }
        }
    });
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
}

function switchPatientsClicked() {
    window.location.href = "adminpatient.html";
}

function removeModuleForPatient(moduleId) {
    console.log("Remove module: " + moduleId + " for patient: " + currentPatientId);
    
    // call api to remove module
    
    // delet local copy for performance
    for (var i = 0; i < patientModules.length; i++) {
        if (patientModules[i].id == moduleId) {
                patientModules.splice(i,1);
        }
    }
    
    writePatientModulesToHtml();
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
    $("patient-name-input").value = currentPatient.patient_name;
}

function addModuleFromForm() {
//    var isPrivate = $("#public-input")[0].checked; // boolean
//    var patientName = $("#patient-name-input")[0].value;
//    var category = $("#category-input")[0].value;
//    var title = $("#title-input")[0].value;
//    var content = $("#content-input")[0].value;
    
    var moduleObj = new Object();
    obj.data_type = "txt";
    obj.title = $("#title-input")[0].value;
    obj.content = $("#content-input")[0].value;
    obj.shared = $("#public-input")[0].checked;
    obj.parentId = $("#category-input")[0].value;
    
    allModules = getAllModules();
    writeModulesToHtml();
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

function addPreviewedModuleToPatient() {
    // call api to add module to patient
    
    // add locally for performance
    for (var i = 0; i < allModules.length; i++) {
        if (allModules[i].id == previewedModuleId) {
            patientModules.push(JSON.parse(JSON.stringify(allModules[i]))); // clones object instead of fref
        }
    }
    console.log("Adding Module " + previewedModuleId + " to patient");
    
    writePatientModulesToHtml();
}


