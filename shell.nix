{
  pkgs,
  nodejs,
  ...
}:
with pkgs;
  mkShell rec {
    buildInputs = [nodejs pkgs.sci];

    shellHook = ''
      export PATH=$(npm bin):$PATH
      echo "Welcome to the iris development environment"
    '';
  }
