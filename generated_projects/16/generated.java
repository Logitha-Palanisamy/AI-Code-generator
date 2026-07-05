public class Main {
  public static String reverseString(String value) {
    return new StringBuilder(value).reverse().toString();
  }

  public static void main(String[] args) {
    System.out.println(reverseString("hello"));
  }
}
