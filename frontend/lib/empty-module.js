// Stub for module paths @splinetool/runtime references but does not ship
// (../libs/draco/*). Spline fetches those decoders from its CDN at runtime;
// webpack only fails because it statically resolves the literal strings.
module.exports = {}
