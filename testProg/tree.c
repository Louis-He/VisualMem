struct node {
    int val;
    struct node* left;
    struct node* right;
};

typedef struct node Node;

int main () {
    Node* head = malloc(sizeof(Node));

    Node* prev_ptr = head;
    for (int i = 0; i < 3; i++) {
        Node* cur_ptr = malloc(sizeof(Node));

        if (i % 2 == 0) {
            prev_ptr->left = cur_ptr;
        } else {
            prev_ptr->right = cur_ptr;
        }
        
        prev_ptr = cur_ptr;
    }

    return 0;
}