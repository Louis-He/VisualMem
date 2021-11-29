#include <stdio.h>

struct test2 {
    double a;
    double b;
};

struct test {
    int a;
    struct test2 t;
    double b;
    struct test2 t2;
};

void level1() {
    int b = 0;
    return;
}

int main() {
    int a, b = 1;
    a = 2;
    b = 3;

    // struct test c = {1, {0.6, -0.2}, 0.5, {0.6, -0.2}};
    // int d[100];
    // struct test e;
    // struct test2 f = {0.0, 0.4};
    // e.a = 2;
    // d[0] = 2;

    // level1();
    // printf("Hello World, %d\n", e.a);

    return 0;
}