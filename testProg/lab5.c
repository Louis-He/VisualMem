#include <stdio.h>
#include <stdlib.h>


void longestSequence(int a[], int size){
    int cnt1 = 1, index, seqNum = 0, big, cnt2 = 1, topIndex;
    int cntArr[size];
    
    for (int i = 0; i < 4; i++) {
        if (a[i] < a[i + 1]) {
            cnt1++;
        }
        else {
            cntArr[seqNum] = cnt1; 
            cnt1 = 1;
            seqNum++;
        }
        
    }

    for (int j = 0; j < seqNum; j++) {
        if (cntArr[j] > big) {
            big = cntArr[j];
        }
    }

    for (int y = 0; y < 4; y++) {
        if (cnt2 == big) {
            index = y;
            break;
        }
        else if (a[y] < a[y + 1]) {
            cnt2++;
        }
        else {
            cnt2 = 1;
        }
    }
    topIndex = index - (big - 1);

    printf("Longest sequence is");

    for (int l = topIndex; l <= index - 1; l++) {
        printf(" %d,", a[l]);
        
    }

    printf(" %d.", a[index]);
    return;
}

int main (void){
    int sizeA = 4;
    int a[4];
    a[0] = 1;
    a[1] = 3;
    a[2] = 5;
    a[3] = 7;

    printf("Array elements are ");
    for (int i =0; i < sizeA; i++)
        printf("%d ", a[i]);
    printf("\n");

    longestSequence(a, 4);
    return 0;
}