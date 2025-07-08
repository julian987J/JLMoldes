exports.up = (pgm) => {
  pgm.addConstraint("Aviso", "avisoid_unique", {
    unique: ["avisoid"],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("Aviso", "avisoid_unique");
};
