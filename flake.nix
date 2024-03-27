{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.noxide.url = "github:dominicegginton/noxide";

  outputs = {
    self,
    nixpkgs,
    noxide,
  }: let
    supportedSystems = ["x86_64-linux" "i686-linux" "x86_64-darwin"];

    forAllSystems = f:
      nixpkgs.lib.genAttrs supportedSystems (system: f system);

    nixpkgsFor = forAllSystems (system:
      import nixpkgs {
        inherit system;
        overlays = [
          self.overlays.default
          noxide.overlays.default
        ];
      });

    nodeForSystem = forAllSystems (system: nixpkgsFor.${system}.nodejs_20);
  in {
    overlays = {
      default = final: prev: {
        sci = import ./sci.nix {
          inherit (final) noxide;
          pkgs = nixpkgsFor.${final.system};
          nodejs = nodeForSystem.${final.system};
        };
      };
    };

    packages = forAllSystems (system: {
      inherit (nixpkgsFor.${system}) sci;
    });

    formatter = forAllSystems (system: let
      pkgs = nixpkgsFor.${system};
    in
      pkgs.alejandra);

    devShells = forAllSystems (system: let
      pkgs = nixpkgsFor.${system};
      nodejs = nodeForSystem.${system};
    in {
      default = import ./shell.nix {inherit pkgs nodejs;};
    });
  };
}
