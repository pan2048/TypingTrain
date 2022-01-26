describe("Editor", function() {
  var Editor = require('Editor'),
      editor;

  beforeEach(function(){
    editor = new Editor;
  });

  it("should be possible to instatiate", function() {
    expect(editor).toBeTruthy();
  });

  it("should be possible to get current document", function(){
    expect(editor._document).toBeTruthy();
  });
});