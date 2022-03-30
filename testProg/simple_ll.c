#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

struct node {
    int val;
    struct node* next;
};

typedef struct node Node;

int main() {
    
    Node* head = malloc(sizeof(Node));
    head->val = 0;
    head->next = NULL;

    Node* prev_ptr = head;
    Node* cur_ptr;
    for (int i = 1; i < 3; i++) {
        cur_ptr = malloc(sizeof(Node));
        cur_ptr->val = i;
        cur_ptr->next = NULL;

        prev_ptr->next = cur_ptr;
        prev_ptr = cur_ptr;
    }

    return 0;
}