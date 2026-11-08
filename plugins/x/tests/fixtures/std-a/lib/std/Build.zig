pub const LazyPath = union(enum) {
    relative: []const u8,
    /// Deprecated, use `src_path`.
    cwd_relative: []const u8,
};
