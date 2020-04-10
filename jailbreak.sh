#!/bin/bash
#
# Set your EMRs free!
cat << EndOfMessage
      ___      __        __    ___       _______    _______    _______       __       __   ___  
     |"  |    /""\      |" \  |"  |     |   _  "\  /"      \  /"     "|     /""\     |/"| /  ") 
     ||  |   /    \     ||  | ||  |     (. |_)  :)|:        |(: ______)    /    \    (: |/   /  
     |:  |  /' /\  \    |:  | |:  |     |:     \/ |_____/   ) \/    |     /' /\  \   |    __/   
  ___|  /  //  __'  \   |.  |  \  |___  (|  _  \\  //      /  // ___)_   //  __'  \  (// _  \   
 /  :|_/ )/   /  \\  \  /\  |\( \_|:  \ |: |_)  :)|:  __   \ (:      "| /   /  \\  \ |: | \  \  
(_______/(___/    \___)(__\_|_)\_______)(_______/ |__|  \___) \_______)(___/    \___)(__|  \__) 

An Omic™ Initiative.

EndOfMessage
# Setup
cd src/
# Init, first run
echo "Installing packages (if not already installed)..."
if ! [ -x "$(command -v brew)" ]; then
  echo 'Error:  brew is not installed.' >&2
  exit 1
fi
npm i > /dev/null
# Run
echo "Booting up 'blackra1n'..."
sleep 2
echo "Ha.  Just kidding."
npm run start
