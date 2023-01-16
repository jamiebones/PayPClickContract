const getArrayItemByIndex = (array, index) => {
  const item = array.find((e) => e.index == index);
  if (
    (item && item.index == item.leftPointer) ||
    (item && item.index == item.rightPointer)
  ) {
    return undefined;
  }
  return item;
};

const GetAllNodesAtEachLevel = (root) => {
  let nodes = [];
  let queue = [];
  let levels = [];
  queue.push(root[0]);
  levels.push(0);
  while (queue.length > 0) {
    let current = queue.shift();
    let level = levels.shift();
    if (!nodes[level]) {
      nodes[level] = [];
    }
    nodes[level].push(current);
    if (current.leftPointer) {
      //check
      const leftChild = getArrayItemByIndex(root, current.leftPointer);
      if (leftChild) {
        queue.push(leftChild);
        levels.push(level + 1);
      }
    }
    if (current.rightPointer) {
      //check
      const rightChild = getArrayItemByIndex(root, current.rightPointer);
      if (rightChild) {
        queue.push(rightChild);
        levels.push(level + 1);
      }
    }
  }
  return nodes;
};

function chunkArray(arr) {
  let result = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push(arr.slice(i, i + 2));
  }
  return result;
}

const CalculateSMBBonus = (arrayRoot, rootArray) => {
  //loop through the array
  let smb = 0;
  let returnArray = [];
  for (let i = 0; i < arrayRoot.length; i++) {
    const array = arrayRoot[i];
    for (let j = 0; j < array.length; j++) {
      if (i == 0) {
        //the direct subnode here
        const node = arrayRoot[i];
        const leftChild = getArrayItemByIndex(rootArray, node[0].leftPointer);
        const rightChild = getArrayItemByIndex(rootArray, node[0].rightPointer);
        if (leftChild && rightChild) {
          //check the points
          if (leftChild.points > 0 && rightChild.points > 0) {
            smb++;
            leftChild.points--;
            rightChild.points--;
            returnArray.push(leftChild);
            returnArray.push(rightChild);
          }
        }
      } else if (i == 1) {
        const left = arrayRoot[i][0];
        const right = arrayRoot[i][1];
        if (left && right) {
          const leftOneLeft = getArrayItemByIndex(rootArray, left.leftPointer);

          const leftOneRight = getArrayItemByIndex(
            rootArray,
            left.rightPointer
          );

          const rightOneLeft = getArrayItemByIndex(
            rootArray,
            right.leftPointer
          );

          const rightOneRight = getArrayItemByIndex(
            rootArray,
            right.rightPointer
          );

          if (leftOneLeft && leftOneRight && rightOneLeft && rightOneRight) {
            //subtract from the points here
            if (leftOneLeft.points > 0 && rightOneLeft.points > 0) {
              //subtract one from each and increment smb
              smb++;
              //put into an array
              leftOneLeft.points--;
              rightOneLeft.points--;
              returnArray.push(leftOneLeft);
              returnArray.push(rightOneLeft);
            }

            //subtract from the points here
            if (leftOneRight.points > 0 && rightOneRight.points > 0) {
              //subtract one from each and increment smb
              smb++;
              //put into an array
              leftOneRight.points--;
              rightOneRight.points--;
              returnArray.push(leftOneRight);
              returnArray.push(rightOneRight);
            }
          }
        }
        //don't continue go to the next itera📺
        break;
      } else {
        //break to chunks
        let chunks = chunkArray(arrayRoot[i]);
        //loop through the chucks and see if we can add
        for (let k = 0; k < chunks.length; k += 2) {
          const left = chunks[k];
          const right = chunks[k + 1];
          //

          if (left && left[0] && left[1]) {
            //we have the full four node sub three here
            //check if their right and right is in the array
            const leftOneLeft = getArrayItemByIndex(
              rootArray,
              left[0].leftPointer
            );
            const leftOneRight = getArrayItemByIndex(
              rootArray,
              left[0].rightPointer
            );

            const leftTwoLeft = getArrayItemByIndex(
              rootArray,
              left[1].leftPointer
            );

            const leftTwoRight = getArrayItemByIndex(
              rootArray,
              left[1].rightPointer
            );

            if (leftOneLeft && leftTwoLeft) {
              //we can check the points here
              if (leftOneLeft.points > 0 && leftTwoLeft.points > 0) {
                //match here
                smb++;
                leftOneLeft.points--;
                leftTwoLeft.points--;
                returnArray.push(leftOneLeft);
                returnArray.push(leftTwoLeft);
              }
            }

            if (leftOneRight && leftTwoRight) {
              //we can check the points here
              if (leftOneRight.points > 0 && leftTwoRight.points > 0) {
                //match here
                smb++;
                leftOneRight.points--;
                leftTwoRight.points--;
                returnArray.push(leftOneRight);
                returnArray.push(leftTwoRight);
              }
            }
          }

          if (right && right[0] && right[1]) {
            const rightOneLeft = getArrayItemByIndex(
              rootArray,
              right[0].leftPointer
            );

            const rightOneRight = getArrayItemByIndex(
              rootArray,
              right[0].rightPointer
            );

            const rightTwoLeft = getArrayItemByIndex(
              rootArray,
              right[1].leftPointer
            );

            const rightTwoRight = getArrayItemByIndex(
              rootArray,
              right[1].rightPointer
            );

            if (rightOneLeft && rightTwoLeft) {
              //we can check the points here
              if (rightOneLeft.points > 0 && rightTwoLeft.points > 0) {
                //match here
                smb++;
                rightOneLeft.points--;
                rightTwoLeft.points--;
                returnArray.push(rightOneLeft);
                returnArray.push(rightTwoLeft);
              }
            }

            if (rightOneRight && rightTwoRight) {
              //we can check the points here
              if (rightOneRight.points > 0 && rightTwoRight.points > 0) {
                //match here
                smb++;
                rightOneRight.points--;
                rightTwoRight.points--;
                returnArray.push(rightOneRight);
                returnArray.push(rightTwoRight);
              }
            }
          }
        }
        break;
      }
    }
  }
  return { smb: smb, nodes: returnArray };
};

module.exports = {
  GetAllNodesAtEachLevel,
  CalculateSMBBonus,
};
