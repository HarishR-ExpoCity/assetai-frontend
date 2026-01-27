/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  basePath: `${process.env.APPLICATION_ROOT}`,
  trailingSlash: true,
};
