var currentPatientId;
var currentPatientName;

$(document).ready(function () {
    loadModuleListAndWriteToHtml();
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
    
    $(".module-list li").click(function () {
        console.log(this);
        showModuleOverview(this.id);
    });
});

function addNewPatient() {
    
}

function showModuleOverview(moduleId) {
    $(".module-preview-title")[0].innerHTML = "MODULE: " + moduleId;
    $(".module-preview-content")[0].innerHTML = "<p>CONTENT HERE</p>";
}

function loadModuleListAndWriteToHtml() {
    var moduleListHtml = '';
    moduleListHtml += '<li id="104"><p class="module-title">Multiple Sclerosis</p></li>\n'
    moduleListHtml += '<li id="105"><p class="module-title">Dementia</p></li>\n'
    moduleListHtml += '<li id="106"><p class="module-title">Alzheimer\'s</p></li>\n'
    moduleListHtml += '<li id="104">\n'
    moduleListHtml += '<p class="module-title module-parent-title">Respitory</p>\n'
    moduleListHtml += '<ul class="module-children-list">\n'
    moduleListHtml += '<li id="107"><p class="module-title">Asthma</p></li>\n'
    moduleListHtml += '<li id="108"><p class="module-title">Ashtma 2</p></li>\n'
    moduleListHtml += '<li id="109"><p class="module-title">Asthma 3</p></li>\n'
    moduleListHtml += '<li id="110"><p class="module-title">Asthma 4</p></li>\n'
    moduleListHtml += '</ul>\n'
    moduleListHtml += '</li>\n'
    moduleListHtml += '<li id="111"><p class="module-title">Stroke</p></li>\n'
    $(".module-list")[0].innerHTML = moduleListHtml;
}

function loadPatientModulesAndWriteToHtml() {
    var moduleListHtml = '';
    moduleListHtml += '<li><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn">X</p></li>\n';
    moduleListHtml += '<li><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn">X</p></li>\n';
    moduleListHtml += '<li><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn">X</p></li>\n';
    moduleListHtml += '<li><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn">X</p></li>\n';
    moduleListHtml += '<li><p class="module-title module-title-with-btn">Dementia Overview</p><p class="module-title-btn">X</p></li>\n';
    $(".module-list-patient")[0].innerHTML = moduleListHtml;
}

function loginPatient() {
    var patientId = $("#patient-id-input")[0].value;
    if (patientId == '' || isNaN(patientId)) {
        return;
    }
    
    currentPatientId = patientId;
    currentPatientName = getPatientNameForId(patientId);
    
    loadPatientModulesAndWriteToHtml();
    
    $(".login-container").hide();
    $(".module-select-container").show();
}

function getPatientNameForId(patientId) {
    var name = 'John Smith';
//    $.ajax({
//        url: '',
//        type: 'GET';
//        success: function () {
//            console.log("RECEIVED ANSWER");
//            name = "answer";
//        }
//    });
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

function removeModuleForPatient(patientId, moduleId) {
    // call api to remove module
    
    loadPatientModulesAndWriteToHtml();
}

function closeModalPopup() {
    $('.fullscreen-modal-container').hide();
}

var categories = ["ActionScript","AppleScript","Asp","BASIC","C","Perl","PHP","Python","Ruby","Scala","Scheme"];
function addNewModuleClicked() {
    $('.fullscreen-modal-container').show();
    $("#category-input").autocomplete({
       source: categories 
    });
}