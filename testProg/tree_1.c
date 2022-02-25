#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

struct node {
    int data;
    struct node* left_child;
    struct node* right_child;
};

int main () {
    struct node* root = malloc(sizeof(struct node*));
    root->data = 1;

    root->left_child = malloc(sizeof(struct node*));
    root->right_child = malloc(sizeof(struct node*));

    root->left_child->data = 2;
    root->right_child->data = 3;

    return 0;
}