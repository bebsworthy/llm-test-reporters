"""All failing tests for unittest reporter validation."""

import unittest
import time
import os


class TestAllFailures(unittest.TestCase):
    """Tests that all fail in different ways."""
    
    def test_assertion_failure(self):
        """Basic assertion failure."""
        expected = 10
        actual = 5
        self.assertEqual(actual, expected, 
                        f"Expected {expected} but got {actual}")
    
    def test_type_mismatch(self):
        """Type error in operation."""
        # Trying to add incompatible types
        result = "string" + 123
        self.assertEqual(result, "string123")
    
    def test_zero_division(self):
        """Division by zero error."""
        numerator = 10
        denominator = 0
        result = numerator / denominator
        self.assertEqual(result, float('inf'))
    
    def test_index_out_of_bounds(self):
        """Index error accessing list."""
        items = [1, 2, 3]
        # Accessing index that doesn't exist
        value = items[10]
        self.assertEqual(value, 4)
    
    def test_key_not_found(self):
        """Key error accessing dictionary."""
        data = {"name": "Alice", "age": 25}
        # Accessing non-existent key
        city = data["city"]
        self.assertEqual(city, "New York")
    
    def test_attribute_missing(self):
        """Attribute error on object."""
        class Person:
            def __init__(self, name):
                self.name = name
        
        person = Person("Bob")
        # Accessing non-existent attribute
        age = person.age
        self.assertEqual(age, 30)
    
    def test_import_failure(self):
        """Import error for non-existent module."""
        import non_existent_module
        self.assertIsNotNone(non_existent_module.function())
    
    def test_value_conversion_error(self):
        """ValueError in conversion."""
        text = "not a number"
        number = int(text)
        self.assertEqual(number, 42)
    
    def test_name_undefined(self):
        """NameError for undefined variable."""
        # Using undefined variable
        result = undefined_variable * 2
        self.assertEqual(result, 10)
    
    def test_file_not_found(self):
        """Test file operation on non-existent file."""
        with open("/path/that/does/not/exist.txt", "r") as f:
            content = f.read()
        self.assertEqual(content, "expected content")


class TestComplexFailures(unittest.TestCase):
    """More complex failure scenarios."""
    
    def test_nested_assertion_failure(self):
        """Nested data structure assertion."""
        expected = {
            "user": {
                "name": "John",
                "settings": {
                    "theme": "dark",
                    "notifications": True
                }
            }
        }
        
        actual = {
            "user": {
                "name": "John",
                "settings": {
                    "theme": "light",  # Different
                    "notifications": False  # Different
                }
            }
        }
        
        self.assertEqual(actual, expected)
    
    def test_list_comparison_failure(self):
        """List comparison with multiple differences."""
        expected = [1, 2, 3, 4, 5]
        actual = [1, 2, 30, 40, 5]
        self.assertEqual(actual, expected)
    
    def test_custom_exception(self):
        """Custom exception raised."""
        class CustomError(Exception):
            pass
        
        def risky_operation():
            raise CustomError("Operation failed due to custom reason")
        
        result = risky_operation()
        self.assertEqual(result, "success")
    
    def test_multiple_assertions_fail(self):
        """Multiple assertions where first fails."""
        value = 5
        self.assertGreater(value, 10)  # This fails
        self.assertLess(value, 3)      # This won't be reached
        self.assertEqual(value, 0)     # This won't be reached either
    
    def test_timeout_simulation(self):
        """Simulate a slow test that might timeout."""
        # Simulate some work
        total = 0
        for i in range(1000000):
            total += i
        
        # This assertion will fail
        self.assertEqual(total, 0)


class TestAssertionTypes(unittest.TestCase):
    """Test various assertion types that fail."""
    
    def test_true_false_failures(self):
        """Test assertTrue and assertFalse failures."""
        self.assertTrue(False)
        self.assertFalse(True)  # Won't be reached
    
    def test_is_failures(self):
        """Test assertIs and assertIsNot failures."""
        a = [1, 2, 3]
        b = [1, 2, 3]  # Different object
        self.assertIs(a, b)  # Fails - different objects
    
    def test_in_failures(self):
        """Test assertIn and assertNotIn failures."""
        items = ["apple", "banana", "orange"]
        self.assertIn("grape", items)
        self.assertNotIn("apple", items)  # Won't be reached
    
    def test_comparison_failures(self):
        """Test comparison assertion failures."""
        self.assertGreater(5, 10)
        self.assertLess(10, 5)
        self.assertGreaterEqual(4, 5)
        self.assertLessEqual(6, 5)
    
    def test_almost_equal_failure(self):
        """Test assertAlmostEqual failure."""
        # These are not almost equal to 2 decimal places
        self.assertAlmostEqual(0.1 + 0.2, 0.31, places=2)
    
    def test_regex_failure(self):
        """Test regex matching failure."""
        text = "Hello World"
        pattern = r"^Goodbye.*"
        self.assertRegex(text, pattern)
    
    def test_raises_failure(self):
        """Test assertRaises failure."""
        def safe_function():
            return 42  # Doesn't raise exception
        
        with self.assertRaises(ValueError):
            safe_function()


class TestSetUpFailures(unittest.TestCase):
    """Test where setUp might cause issues."""
    
    def setUp(self):
        """Set up that works but leads to test failures."""
        self.data = {"value": 100}
        self.items = []
    
    def test_wrong_setup_value(self):
        """Test expecting different setup value."""
        self.assertEqual(self.data["value"], 200)  # Expects 200, gets 100
    
    def test_empty_list_failure(self):
        """Test expecting non-empty list."""
        self.assertTrue(len(self.items) > 0)  # List is empty
    
    def test_missing_setup_key(self):
        """Test accessing non-existent setup data."""
        value = self.data["missing_key"]
        self.assertEqual(value, "expected")


class TestStringFailures(unittest.TestCase):
    """String-specific test failures."""
    
    def test_string_startswith_failure(self):
        """Test string startswith failure."""
        text = "Python Testing"
        self.assertTrue(text.startswith("Java"))
    
    def test_string_contains_failure(self):
        """Test string contains failure."""
        text = "Hello World"
        self.assertIn("Goodbye", text)
    
    def test_string_case_failure(self):
        """Test string case mismatch."""
        self.assertEqual("HELLO", "hello")  # Case mismatch
    
    def test_string_strip_failure(self):
        """Test string strip expectation failure."""
        text = "  spaces  "
        # Expecting it to not strip spaces
        self.assertEqual(text.strip(), "  spaces  ")


if __name__ == '__main__':
    unittest.main()