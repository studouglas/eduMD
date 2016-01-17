var currentPatientId;
var currentPatient;
var allPatients = [];
var allModules = [];     // array of below objects, parent is 
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
    loadAllPatientsFromServer();
    loadModulesFromServer();
    
    $("#patient-id-input").bind('input', function () {            
        var inputId = $(this).val();
        
        // get name for id from server
        var name = 'Patient not Found';
        var patient = getPatientWithId(inputId);
        if (patient != null) {
            name = patient.patient_name;
            $("#login-button").removeClass('disabled-button');
        } else {
            $("#login-button").addClass('disabled-button');
        }
        
        $("#patient-name-label")[0].innerHTML = name;
        
    });
    
    $(".search-modules").bind('input', function () {            
        writeModulesToHtml($(this).val());
    });
});

// DONE
function showModuleOverview(moduleId) {
    $("#add-module-to-patient-btn").show();
    console.log("showOverview(" + moduleId + ")");
    for (var i = 0; i < allModules.length; i++) {
        if (allModules[i].id == moduleId) {
            $("#module-preview-title")[0].innerHTML = allModules[i].title;
            $("#module-preview-content")[0].innerHTML = allModules[i].content;
            previewedModuleId = moduleId;
        }
    }
}

// DONE
function loadAllPatientsFromServer() {
    $.ajax({
        url: 'http://deltahacks2.appspot.com/user/get/patient/all',
        type: 'GET',
        success: function (data) {
            var jsonData = JSON.parse(data);
            console.log(jsonData);
            allPatients = jsonData.patients;
        }
    });
}

// DONE
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

// DONE
function sortAllModules() {
    allModules.sort(function(a,b) {
        return a.title.localeCompare(b.title);
    });
    
    for (var j = 0; j < allModules.length; j++) {
        var indexOfLastChild = j + 1;
        for (var m = indexOfLastChild; m < allModules.length-1; m++) {
            if (allModules[m].parent_id == allModules[j].id) {
                indexOfLastChild = m+1;
            } else {
                indexOfLastChild = m;
                break;
            }
        }
        for (var i = indexOfLastChild; i < allModules.length; i++) {    
            if (allModules[i].parent_id == allModules[j].id) {
                allModules.splice(indexOfLastChild, 0, allModules[i]); // add element at index
                allModules.splice(i+1, 1); // remove the element
                indexOfLastChild++;
            }
        }
    }
}

// DONE
function loadPatientModulesFromAllModules() {
    patientModules = [];
    var patientModuleNums = currentPatient.patient_modules == null ? [] : currentPatient.patient_modules.split(',');
    for (var i = 0; i < patientModuleNums.length; i++) {
        for (var j = 0; j < allModules.length; j++) {
            if (allModules[j].id == patientModuleNums[i]) {
                patientModules.push(JSON.parse(JSON.stringify(allModules[j]))); // creates copy, not ref
            }
        }
    }
    
    writePatientModulesToHtml();
}

// DONE
function writeModulesToHtml(filter) {
    var modulesToWrite = (filter == null || filter == '') ? allModules : filterModules(filter);
    
    var moduleListHtml = '';
    var levelCounter = 0;
    for (i = 0; i < modulesToWrite.length - 1; i++) {
        var id = modulesToWrite[i].id;
        var title = modulesToWrite[i].title;
        
        // open new list
        if (modulesToWrite[i+1].parent_id == modulesToWrite[i].id) {
            moduleListHtml += '<li id="' + id + '" class="module-parent">\n';
            moduleListHtml += '<p class="module-title module-parent-title">' + title + '</p>\n';
            moduleListHtml += '<ul class="module-children-list">\n';
            levelCounter++;
        } 
        // stay same
        else if (modulesToWrite[i+1].parent_id == modulesToWrite[i].parent_id) {
            moduleListHtml += '<li id="' + id + '"><p class="module-title">' + title + '</p></li>\n';
        } 
        // close list
        else {
            moduleListHtml += '<li id="' + id + '"><p class="module-title">' + title + '</p></li>\n';
            moduleListHtml += '</ul></li>\n';
            levelCounter--;
        }
    }
    var id = modulesToWrite[modulesToWrite.length - 1].id;
    var title = modulesToWrite[modulesToWrite.length - 1].title;
    if (levelCounter == 0) {
        moduleListHtml += '<li id="' + id + '"><p class="module-title">' + title + '</p></li>\n';
    } else {
        moduleListHtml += '<li id="' + id + '"><p class="module-title">' + title + '</p></li>\n';
        moduleListHtml += '</ul></li>\n'
    }
    $(".module-list")[0].innerHTML = moduleListHtml;
    
    $(".module-list li").click(function () {
        if (!$(this).hasClass("module-parent")) {
            showModuleOverview(this.id);   
        }
    });
    
    prepareList();
}

// DONE
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

// DONE
function writePatientModulesToHtml() {
    var moduleListHtml = '';
    for (var i = 0; i < patientModules.length; i++) {
      moduleListHtml += '<li id="' + patientModules[i].id + '"><p class="module-title module-title-with-btn">';
      moduleListHtml += patientModules[i].title + '</p><p class="module-title-btn" onclick="removeModuleForPatient(';
      moduleListHtml += patientModules[i].id + ')">X</p></li>\n';  
    }

    $(".module-list-patient")[0].innerHTML = moduleListHtml;
}

// DONE
function loginPatient() {
    var patientId = $("#patient-id-input")[0].value;
    if (patientId == '' || isNaN(patientId)) {
        return;
    }
    
    $("#switch-patients-btn").show();
    $("#email-link-btn").show();
    currentPatientId = patientId;
    currentPatient = getPatientWithId(patientId);
    
    loadPatientModulesFromAllModules();
    
    var patientIdElements = $("span#patient-id");
    for (i = 0; i < patientIdElements.length; i++) {
        patientIdElements[i].innerHTML = currentPatientId;
    }
    var patientNameElements = $("span#patient-name");
    for (var i = 0; i < patientNameElements.length; i++) {
        patientNameElements[i].innerHTML = currentPatient.patient_name;
    }
    $(".login-container").hide();
    $(".module-select-container").show();
}

// DONE
function getPatientWithId(patientId) {
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i].patient_id == patientId) {
            return allPatients[i];
        }
    }
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

// DONE
function removeModuleForPatient(moduleId) {
    console.log("Remove module: " + moduleId + ")");
    console.log(currentPatient.patient_modules);
    
    if (currentPatient.patient_modules != null && currentPatient.patient_models != "") {
        var patientModulesLoc = currentPatient.patient_modules.split(',');
        for (var i = 0; i < patientModulesLoc.length; i++) {
            patientModulesLoc.splice(i,1);
            currentPatient.patient_modules = patientModulesLoc.join();
            break;
        }
    } else {
        return;
    }
    console.log(currentPatient.patient_modules);
    
    $.ajax({
        url: 'http://deltahacks2.appspot.com/user/edit/patient/' + currentPatientId,
        type: 'POST',
        data: {'modules': currentPatient.patient_modules,
               'patient_id':currentPatientId,
               'patient_name':currentPatient.patient_name
        },
        success: function (data) {
            console.log("Successfulyl removed preview module ");
        }
    });
    
    // delet local copy for performance
    for (var i = 0; i < patientModules.length; i++) {
        if (patientModules[i].id == moduleId) {
                patientModules.splice(i,1);
        }
    }
    
    writePatientModulesToHtml();
}

// DONE
function closeModalPopup() {
    $('.fullscreen-modal-container').hide();
    $('.new-module-modal').hide();
    $('.new-patient-modal').hide();
    $("#new-patient-name-input")[0].value = '';
    $("#public-input")[0].checked = true;
    $("#patient-name-input")[0].value = '';
//    $("#title-input")[0].value = '';
//    $("#content-input")[0].value = '';
}

// DONE
function addNewModuleClicked() {
    $('.new-module-modal').show();
    $("patient-name-input").value = currentPatient.patient_name;
}

// TODO: implement this
function addModuleFromForm() {
    var moduleObj = new Object();
    obj.data_type = "txt";
    obj.title = $("#title-input")[0].value;
    obj.content = $("#content-input")[0].value;
    obj.shared = $("#public-input")[0].checked;
    obj.parentId = $("#category-input")[0].value;
    
    writeModulesToHtml();
    closeModalPopup();
}

// DONE
function addNewPatient() {
    $(".new-patient-modal").show();
}

// DONE
function addNewPatientFromForm() {
    var name = $("#new-patient-name-input")[0].value;
    var id = $("#new-patient-id-input")[0].value;
    $.ajax({
        url: 'http://deltahacks2.appspot.com/user/add/patient',
        type: 'POST',
        data: {'patient_id':id,
               'patient_name':name
        },
        success: function (data) {
            console.log("Successfulyl added patient: " + name);
        }
    });
    
    closeModalPopup();
}

// TODO: check that retains old modules
function addPreviewedModuleToPatient() {
    if (currentPatient.patient_models != null) {
        var patientModulesLoc = currentPatient.patient_models.split(',');
        for (var i = 0; i < patientModulesLoc.length; i++) {
            if (patientModulesLoc[i] == previewedModuleId) {
                return;
            }
        }
    }
    
    if (currentPatient.patient_modules != null && currentPatient.patient_modules != '') {
        currentPatient.patient_modules += "," + previewedModuleId;
    } else {
        currentPatient.patient_modules = previewedModuleId;
    }
    
    console.log("Adding Previews: <" + currentPatient.patient_modules + ">");
    
    $.ajax({
        url: 'http://deltahacks2.appspot.com/user/edit/patient/' + currentPatientId,
        type: 'POST',
        data: {'modules': currentPatient.patient_modules,
               'patient_id':currentPatientId,
               'patient_name':currentPatient.patient_name
        },
        success: function (data) {
            console.log("Successfulyl added preview module ");
        }
    });
    
    // add locally for performance
    for (var i = 0; i < allModules.length; i++) {
        if (allModules[i].id == previewedModuleId) {
            patientModules.push(JSON.parse(JSON.stringify(allModules[i]))); // clones object instead of fref
        }
    }
    console.log("Adding Module " + previewedModuleId + " to patient");
    
    writePatientModulesToHtml();
}

//TODO
//Mailto function
function generateMailto() {
    var subject = 'Dr. Watson has shared health educational materials with';
    var patient_link = 'http://www.deltahacks2.appspot.com/patient/' + currentPatientId;
    var body_message = 'Your health care professional has shared educational materials with you on eduMD. You can find your personalized materials at ' + patient_link + '.';
    var mailto_link = 'mailto:?subject=' + subject + '&body=' + body_message;
    win = window.open(mailto_link,'emailWindow');
}
