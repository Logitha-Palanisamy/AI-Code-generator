def calculate(values: list[float]) -> float:
    return sum(values)

def main():
    numbers = [10.0, 20.5, 30.25]
    result = calculate(numbers)
    print(f'Result: {result}')

if __name__ == '__main__':
    main()
