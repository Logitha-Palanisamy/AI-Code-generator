public class Main {
  public static String checkNumber(int value) {
    if (value % 2 == 0) {
      return "Even number";
    } else {
      return "Odd number";
    }
  }

  public static void main(String[] args) {
    System.out.println(checkNumber(10));
  }
}
