exports.up = (pgm) => {
  pgm.addConstraint("Deve", "Deve_pkey", { primaryKey: "deveid" });
};

exports.down = (pgm) => {
  pgm.dropConstraint("Deve", "Deve_pkey");
};
