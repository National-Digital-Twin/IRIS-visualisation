{
  pkgs,
  nodejs,
  ...
}:
with pkgs;
  writeShellScriptBin "sci" ''
    echo "installing dependencies"
    ${nodejs}/bin/npm install
    echo "building iris"
    ${nodejs}/bin/npm run build
    echo "starting powerstat"
    ${pkgs.nodePackages.http-server}/bin/http-server -p 4200 dist/iris 2>&1 > /dev/null &
    echo "measuring idle power consumption ..."
    sudo ${pkgs.powerstat}/bin/powerstat -cDHRf 2 > ./powerstat-inactive.log
    echo "opening chromium"
    ${pkgs.chromium}/bin/chromium --app=http://localhost:4200 --user-data-dir=/tmp/iris 2>&1 > /dev/null &
    echo "measuring active power consumption ..."
    sudo ${pkgs.powerstat}/bin/powerstat -cDHRf 2 > ./powerstat-active.log
    echo "killing all background processes"
    ${pkgs.killall}/bin/killall http-server
    ${pkgs.killall}/bin/killall chromium
  ''
