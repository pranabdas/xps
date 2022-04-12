#!/bin/bash
echo "Building site ..."

if [ -d "build" ] ; then
  rm -rf build
fi

npm run build

if [ -d "tmp" ] ; then
  rm -rf tmp
fi

mkdir tmp && cd tmp

echo "Cloning repo ..."
git clone --branch gh-pages https://github.com/pranabdas/xps
rsync -azh --exclude .git --delete ../build/ xps
cd xps
find . -type f -name .DS_Store -delete

echo "Updating on github ..."
git add --all && git commit --amend --no-edit && git push origin gh-pages --force
# New commit
# git add --all && git commit -m "Updates" && git push origin gh-pages

cd ../..
if [ -d "tmp" ] ; then
  rm -rf tmp
fi

echo "Deployed."

