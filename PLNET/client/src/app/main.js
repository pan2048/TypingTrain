import {Config} from './config.js';
import {Util} from '../lib/util.js';

class Main {
  constructor() {
    new Config(config => {
    });
  }
}



function decodeHtml(html) {
    var text = $('<textarea />').html(html).text();
    return text;
}

// reserved: ; / ? : @ = &
// special: # < >
// " % { } | \ ^ ~ [ ] `
function encodeSpecial(url) {
    var dictionary = { 
        " ": "_"  
        ,"#":"%23" 
        ,"<": "%3C"  
        ,">": "%3E"  
        
    },
    result = url.replace(/[ #<>]/gi, m => dictionary[m]);
    return result;
}

function url_escape(str) {
    return encodeSpecial(str);
}


$(document).ready(function() {
  $('#search_text').each(function() {
    var elem = $(this);
    elem.data('oldVal', elem.val());
    elem.bind("propertychange change click keyup input paste", function(event){
      if (elem.data('oldVal') != elem.val()) {
        elem.data('oldVal', elem.val());
        $.post('/action/suggest/'+ url_escape($('#search_text').val()) , 
            { 
                word:  elem.val()
            }, 
            function(msg){
                var returnedData = JSON.parse(msg);
                $( "#search_text" ).autocomplete({
                    source: returnedData
                });
            }
        );        
      }
    });
  });


  $('#search_form').submit(function(){
    var v = $('#search_text').val();
    v = v.replace("_", "__"); 
    $(this).attr('action', '/dictionary/' + url_escape(v));
  }); 

  $('#login_div').on('click', '#login_button', function(e) {
    e.preventDefault();
    var $a = $(this);
    
    $.post('/action/login/' , 
      { 
        uname:  $('#uname').val(),
        password:  $('#password').val(),
      }, 
      function(msg){
        $("#info").html(msg);
        setTimeout(function() {
            $("#info").html("");
        }, 2000);
      }
    );    
  }); 

  $('main').on('click', function(e) {
    if (e.target && /action\/index\//.test(e.target.href)) {
      e.preventDefault();
      var main = $(this);
      
      let regexp = /action\/index\/(.*)/;
      let result = e.target.href.match(regexp);
      let newUrl = "/action/index/" + encodeURIComponent(result[1]);
      //window.alert(newUrl);
      $.post(newUrl, 
        {},
        function(msg){
            $("#words").html(msg);
        }
      );      
    }
  });

  $('main').on('click', '#word_create', function(e) {
    e.preventDefault();
    var $a = $(this);
    $.ajax({
        type: "POST",
        url:  $a.data('href'),
        success: function(msg) {
          //console.log(msg);
          $("main").html(msg);
        }
    });
  });
  
  $('main').on('click', '#word_edit', function(e) {
    e.preventDefault();
    var main = $(this);
    $.post(main.data('href') , 
      {},
      function(returnedData){
        $("main").html(returnedData);
      }
    );
  });
    
  $('main').on('click', '#word_save', function(e) {
    e.preventDefault();
    var title = $('#word_title').val();
    $.post('/action/save/' + url_escape(title) , 
      { 
        title:  title,
        caption:  $('#word_caption').val(),
        jumps:  $('#word_jumps').val(),
        parents:  $('#word_parents').val(),
        tags:  $('#word_tags').val(),
        content:  encodeURIComponent($('#word_content').val().replace(new RegExp(/ /, 'g'), "&nbsp;")),
        caption_new:  $('#word_caption_new').val(),
        jumps_new:  $('#word_jumps_new').val(),
        parents_new:  $('#word_parents_new').val(),
        tags_new:  $('#word_tags_new').val(),
        content_new: encodeURIComponent($('#word_content_new').val().replace(new RegExp(/ /, 'g'), "&nbsp;"))
      }, 
      function(msg){
        $("#info").html(msg);
        setTimeout(function() {
            $("#info").html("");
        }, 2000);
      }
    );
  });

  new Main();

  const tagMap = {
    table: 'table table-striped',
  }
    
  const bindings = Object.keys(tagMap)
    .map(key => ({
      type: 'output',
      regex: new RegExp(`<${key}(.*)>`, 'g'),
      replace: `<${key} class="${tagMap[key]}" $1>`
  }));
   
  var converter = new showdown.Converter({
       tables: true 
      ,omitExtraWLInCodeBlocks: true
      ,emoji: true 
      ,noHeaderId: false
      ,parseImgDimensions: true
      ,simplifiedAutoLink: true
      ,literalMidWordUnderscores: true
      ,strikethrough: true
      ,tablesHeaderId: false
      ,ghCodeBlocks: true
      ,tasklists: true
      ,smoothLivePreview: true
      ,prefixHeaderId: false
      ,disableForced4SpacesIndentedSublists: false
      ,ghCompatibleHeaderId: true
      ,smartIndentationFix: false    
  });
  converter.setFlavor('github');
  var code_html = $('#word_content').text();
  code_html = converter.makeHtml(code_html);
  $("#word_content").html(code_html);
   
  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightBlock(block);
  });
  
  mermaid.initialize({startOnLoad: false});

  document.querySelectorAll('.mermaid').forEach((block) => {
    mermaid.render('theGraph', block.textContent.trim(), function(svgCode) {
        block.innerHTML = svgCode;
    });
  });
});