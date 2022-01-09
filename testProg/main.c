#include <stdio.h>
#include <stdlib.h>

struct node {
    int val;
    struct node* next;
};

typedef struct node Node;


int main() {
    int a, b = 1;
    a = 2;
    b = 3;
    
    Node* head = malloc(sizeof(Node));
    Node* tail = malloc(sizeof(Node));

    Node ins = {1, NULL};

    head->val = 0;
    tail->val = 1;
    head->next = tail;
    tail->next = NULL;

    return 0;
}