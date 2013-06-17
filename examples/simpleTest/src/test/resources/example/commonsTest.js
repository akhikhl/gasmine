describe("normalizeLines", function() {
  it("should leave null string intact", function() {
    expect(normalizeLines(null)).toBeNull();
  });
  it("should leave undefined string intact", function() {
    expect(normalizeLines(undefined)).toBeUndefined();
  });  
  it("should leave empty string intact", function() {
    expect(normalizeLines("")).toEqual("");
  });  
  it("should convert string of spaces to empty string", function() {
    expect(normalizeLines("  \n \t  ")).toEqual("");
  });  
  it("should trim spaces of single line", function() {
    expect(normalizeLines("  \naaa bbb\t  ")).toEqual("aaa bbb");
  });  
  it("should trim leading spaces", function() {
    expect(normalizeLines("  \naaa   \nbbb\t  ")).toEqual("aaa\nbbb");
  });
  it("should skip empty lines", function() {
    expect(normalizeLines("\n\n  \n\naaa\n   \n   \nbbb\n\n\n")).toEqual("aaa\nbbb");
  });  
});