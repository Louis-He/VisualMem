#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>


int main () {

    int array_1_longlongnametest[] = {11, 22, 33, 44, 55};
    
    int *array_2 = NULL;

	array_2 = (int*) malloc (4*sizeof(int));

    array_2[0] = 111;
    array_2[1] = 222;
    array_2[2] = 333;
    array_2[3] = 444;

	free(array_2);

    return 0;
}