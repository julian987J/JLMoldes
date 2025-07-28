exports.up = (pgm) => {
  pgm.addColumns("Devo", {
    id: { type: "serial", primaryKey: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("Devo", ["id"]);
};