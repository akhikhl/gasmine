describe("Example of jasmine-based test", function() {
  it("empty string is empty", function() {
    expect("".length).toEqual(0);
  });
  it("non-empty string is not empty", function() {
    expect("abc".length).toEqual(3);
  });
  it("string containing only spaces is not empty", function() {
    expect("abc").toEqual("abc");
  });
});

